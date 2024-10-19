import React, { useState, useEffect, useRef } from 'react'
import type Player from 'video.js/dist/types/player'
import type { QualityLevel } from 'videojs-contrib-quality-levels'

import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Copy, Check, X } from 'lucide-react'
import { Lsat } from 'lsat-js'

const quickAccessDurations = [
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
]

// Simulated exchange rate (1 USD = 100,000 sats)
const SATS_PER_USD = 100000

interface CustomModalComponentProps {
  vjsBridgeComponent: {
    player: () => Player
  }
  paymentCallback: (l402: Lsat) => void
  show: boolean
  onClose: () => void
}

// TODO:
// - integrate l402
// - sort quality levels by price/bitrate
const CustomModalComponent: React.FC<CustomModalComponentProps> = ({
  vjsBridgeComponent,
  paymentCallback,
  show,
  onClose,
}) => {
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(60) // Default to 60 minutes
  const [totalPrice, setTotalPrice] = useState(0)
  const [invoice, setInvoice] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [expirationTime, setExpirationTime] = useState(0)

  const handlePurchase = () => {
    if (selectedQuality && selectedDuration) {
      // const newInvoice = generateInvoice(selectedQuality, selectedDuration, totalPrice)
      setInvoice('')
      setShowQRCode(true)
      setExpirationTime(15 * 60) // Set expiration time to 15 minutes
    }
  }

  const handleClose = () => {
    console.debug('CustomModalComponent: handleClose')
    // vjsBridgeComponent.player().pause()
    onClose()
  }

  const handleBack = () => {
    setShowQRCode(false)
    setInvoice('')
    setIsCopied(false)
    setExpirationTime(0)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(invoice).then(() => {
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
    const player = vjsBridgeComponent.player()
    const qualityLevels = player.qualityLevels()

    const updateQualityLevels = () => {
      const levels = qualityLevels.levels_
      const reversedLevels = [...levels].reverse()
      setQualityLevels(reversedLevels)
    }

    updateQualityLevels()

    qualityLevels.on('addqualitylevel', updateQualityLevels)
    qualityLevels.on('removequalitylevel', updateQualityLevels)

    return () => {
      qualityLevels.off('addqualitylevel', updateQualityLevels)
      qualityLevels.off('removequalitylevel', updateQualityLevels)
    }
  }, [vjsBridgeComponent])

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
            {!showQRCode ? (
              <>
                <h2 className="mb-2 text-lg font-semibold">Select Quality and Duration</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1 block text-sm font-medium">Quality</Label>
                    <RadioGroup
                      onValueChange={(value) => setSelectedQuality(qualityLevels[parseInt(value)]!)}
                      className="grid grid-cols-3 gap-2"
                    >
                      {qualityLevels.map((level: QualityLevel, index) => (
                        <Label
                          key={level.id}
                          className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-colors
                            ${
                              selectedQuality && selectedQuality.id === level.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background hover:bg-accent hover:text-accent-foreground'
                            } 
                            cursor-pointer`}
                        >
                          <RadioGroupItem value={`${index}`} id={`${level.id}`} className="sr-only" />
                          <span className="text-sm font-medium">
                            {level.height}p{level.framerate}
                          </span>
                          <span className="text-xs">
                            {level.price ? `${msatsPerSecToSatsPerMin(level.price)} sats/min` : 'free'}
                          </span>
                        </Label>
                      ))}
                    </RadioGroup>
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
                          {quickAccessDurations.map((duration) => (
                            <Button
                              key={duration.label}
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDuration(duration.minutes)}
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
                    <Button onClick={handlePurchase} disabled={!selectedQuality || !selectedDuration}>
                      Generate Invoice
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Scan QR Code to Pay</h2>
                <div className="flex items-center space-x-4">
                  <QRCodeSVG value={invoice} size={150} />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-500">Use your preferred payment app to scan the QR code.</p>
                    <div className="flex items-center space-x-2">
                      <Input readOnly value={invoice} className="flex-grow text-xs" />
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
