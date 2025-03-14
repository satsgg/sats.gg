import React, { useState, useEffect, useRef } from 'react'
import type Player from 'video.js/dist/types/player'
import type { QualityLevel } from 'videojs-contrib-quality-levels'

import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectValue, SelectItem, SelectContent, SelectTrigger } from '@/components/ui/select'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Copy, Check, X, Loader2 } from 'lucide-react'
import { Lsat } from 'lsat-js'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { SATS_PER_USD } from '@/utils/util'
import useWebln from '~/hooks/useWebln'

const quickAccessDurations = [
  { label: '2m', minutes: 2 },
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '30m', minutes: 30 },
]

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

type InvoiceStatus = {
  preimage: string | null
  status: string
}

interface CustomModalComponentProps {
  vjsBridgeComponent: {
    player: () => Player
  }
  paymentCallback: (l402: Lsat) => void
  show: boolean
  onClose: () => void
}

// TODO:
// - improve sort quality levels by price/bitrate
// - parse invoice to display price and expiration time
// - hookup expiration timer
// - handle selecting free quality level
// - set quality level to chosen or auto? on successful payment
const CustomModalComponent: React.FC<CustomModalComponentProps> = ({
  vjsBridgeComponent,
  paymentCallback,
  show,
  onClose,
}) => {
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(30) // Default to 30 minutes
  const [streamPayments, setStreamPayments] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)
  const [isCopied, setIsCopied] = useState(false)
  const [expirationTime, setExpirationTime] = useState(0)
  const [l402Challenge, setL402Challenge] = useState<Lsat | null>(null)
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false)
  const { available: weblnAvailable, weblnPay } = useWebln()
  const { toast } = useToast()

  const handlePurchase = async () => {
    const uri = selectedQuality?.resolvedUri
    if (!uri) return
    setIsLoadingChallenge(true)
    console.debug('requesting invoice')
    console.debug('uri', selectedQuality.resolvedUri)
    let challenge
    try {
      let res = await fetch(`${uri}?d=${selectedDuration * 60}`)
      if (res.status !== 402) throw new Error('Failed to fetch l402 challenge')
      let challengeHeader = res.headers.get('WWW-Authenticate')
      if (!challengeHeader) throw new Error('No challenge header')
      challenge = Lsat.fromHeader(challengeHeader)

      // Try to pay with WebLN first if available
      if (weblnAvailable) {
        try {
          let result = await weblnPay(challenge.invoice)
          if (!result.success) {
            setL402Challenge(challenge)
            return
          }

          const l402 = challenge
          if (!result.preimage) {
            throw new Error('should be a preimage?')
          }
          l402.setPreimage(result.preimage)
          console.debug('finished l402', l402)
          paymentCallback(l402)
          handleClose()
          return
        } catch (e) {
          console.debug('WebLN payment failed or declined:', e)
          // Continue to show QR code if WebLN payment fails
        }
      }

      // If WebLN is not available or payment failed, show QR code
      setL402Challenge(challenge)
    } catch (e: any) {
      console.error('something else happened')
      console.error('Failed to fetch l402 challenge:', e)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate invoice. Please try again.',
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      })
    } finally {
      setIsLoadingChallenge(false)
    }
  }

  const handleClose = () => {
    console.debug('CustomModalComponent: handleClose')
    // vjsBridgeComponent.player().pause()
    // vjsBridgeComponent.player().qualitySelector().setQuality(null)
    setL402Challenge(null)
    setIsCopied(false)
    setExpirationTime(0)
    onClose()
  }

  const handleBack = () => {
    setL402Challenge(null)
    setIsCopied(false)
    setExpirationTime(0)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(l402Challenge?.invoice || '').then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return hours > 0
      ? `${hours} hour${hours > 1 ? 's' : ''} ${
          remainingMinutes > 0 ? `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''
        }`
      : `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const formatExpirationTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const msatsPerSecToSatsPerMin = (msatsPerSec: number) => {
    return Math.floor((msatsPerSec * 60) / 1000)
  }

  const formatUSD = (sats: number) => {
    const usd = sats / SATS_PER_USD
    return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  useEffect(() => {
    if (!selectedQuality || !selectedQuality.price) {
      setTotalPrice(0)
      return
    }
    setTotalPrice(selectedDuration * msatsPerSecToSatsPerMin(selectedQuality.price))
  }, [selectedQuality, selectedDuration])

  useEffect(() => {
    const uri = selectedQuality?.resolvedUri
    if (!l402Challenge || !uri) return
    console.debug('l402Challenge', l402Challenge)
    const url = new URL(uri)
    const baseUrl = `${url.protocol}//${url.host}`

    const awaitPayment = async () => {
      let payment: InvoiceStatus | null = null
      let failedAttempts = 0
      while (true) {
        try {
          // TODO: Use the new invoice endpoint
          let paymentRes = await fetch(`${baseUrl}/.well-known/l402/invoice?hash=${l402Challenge.paymentHash}`)
          payment = await paymentRes.json()
          if (payment && payment.status === 'SETTLED') break
          await sleep(1000)
        } catch (e: any) {
          console.error('error fetching payment status', e)
          if (failedAttempts > 3) {
            console.error('timed out fetching payment status, closing')
            return
          }
          failedAttempts = failedAttempts + 1
        }
      }
      const l402 = l402Challenge // deep copy?
      if (!payment.preimage) {
        console.error('BUG')
        return
      }
      l402.setPreimage(payment.preimage)
      console.debug('finished l402', l402)
      paymentCallback(l402)
      handleClose()
      // this is just wrong
      // for (let i = 0; i < qualityLevels.length; i++) {
      //   const qualityLevel = qualityLevels[i]
      //   console.debug('Quality Level', i, 'enabled:', qualityLevel.enabled)
      // }
      // TODO: Set player to quality level chosen
    }
    awaitPayment()
  }, [l402Challenge])

  useEffect(() => {
    const player = vjsBridgeComponent.player()
    const qualityLevels = player.qualityLevels()

    const updateQualityLevels = () => {
      const levels = qualityLevels.levels_
      const sortedLevels = [...levels].sort((a, b) => b.bitrate - a.bitrate)
      setQualityLevels(sortedLevels)
      setSelectedQuality(sortedLevels[0])
    }

    updateQualityLevels()

    qualityLevels.on('addqualitylevel', updateQualityLevels)
    qualityLevels.on('removequalitylevel', updateQualityLevels)

    return () => {
      qualityLevels.off('addqualitylevel', updateQualityLevels)
      qualityLevels.off('removequalitylevel', updateQualityLevels)
    }
  }, [vjsBridgeComponent])

  const displayQuality = (quality: QualityLevel) => {
    return `${quality.height}p, ${quality.price === 0 ? 'free' : quality.price + ' millisats/sec'}`
  }

  if (!show) return null
  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="max-h-[90%] w-[90%] max-w-[500px] overflow-y-auto rounded-lg bg-background text-foreground shadow-lg">
          <div className="relative p-6">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => handleClose()}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
            {!l402Challenge ? (
              <>
                <h2 className="mb-2 text-lg font-semibold">Select Quality and Duration</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1 block text-sm font-medium">Quality</Label>
                    <div className="grid gap-2">
                      <Select
                        onValueChange={(value) => setSelectedQuality(qualityLevels[parseInt(value)]!)}
                        value={selectedQuality ? `${qualityLevels.indexOf(selectedQuality)}` : undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualityLevels.map((level: QualityLevel, index: number) => (
                            <SelectItem key={index} value={`${index}`}>
                              {displayQuality(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="duration" className="mb-1 block text-sm font-medium">
                      Duration
                    </Label>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={480}
                        step={1}
                        value={[selectedDuration]}
                        onValueChange={(value) => setSelectedDuration(value[0]!)}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatDuration(selectedDuration)}</span>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!weblnAvailable}
                            onClick={() => {
                              setStreamPayments(!streamPayments)
                            }}
                            className="px-2 py-1 text-xs"
                          >
                            <span
                              className={`mr-1 inline-block h-2 w-2 rounded-full ${
                                streamPayments ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></span>
                            Stream
                          </Button>
                          {quickAccessDurations.map((duration) => (
                            <Button
                              key={duration.label}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDuration(duration.minutes)
                              }}
                              className="px-2 py-1 text-xs"
                            >
                              {duration.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Total: {totalPrice} sats</p>
                      <p className="text-xs text-gray-500">≈ {formatUSD(totalPrice)}</p>
                    </div>
                    <Button
                      onClick={handlePurchase}
                      disabled={!selectedQuality || !selectedDuration || isLoadingChallenge}
                    >
                      {isLoadingChallenge ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {streamPayments ? 'Stream' : 'Purchase'}
                        </>
                      ) : streamPayments ? (
                        'Stream'
                      ) : (
                        'Purchase'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Scan QR Code to Pay</h2>
                <div className="flex items-center space-x-4">
                  <a href={`lightning:${l402Challenge.invoice}`}>
                    <QRCodeSVG value={l402Challenge.invoice} size={150} />
                  </a>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-500">Use your preferred payment app to scan the QR code.</p>
                    <div className="flex items-center space-x-2">
                      <Input readOnly value={l402Challenge.invoice} className="flex-grow text-xs" />
                      <Button size="icon" onClick={handleCopy} variant="outline">
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">{isCopied ? 'Copied' : 'Copy'}</span>
                      </Button>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">Total: {totalPrice} sats</p>
                      <p className="text-gray-500">~ {formatUSD(totalPrice)}</p>
                      <p className="text-gray-500">Expires in: {formatExpirationTime(expirationTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button onClick={handleBack} variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  {/* <Button onClick={() => paymentCallback('')} size="sm">
                      Pay
                    </Button> */}
                  <p className="text-xs text-gray-500">Having issues? Contact support</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* )} */}
    </div>
  )
}

export default CustomModalComponent
