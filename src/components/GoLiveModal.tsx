import React, { useState, useEffect } from 'react'
import { trpc } from '~/utils/trpc'
import { InvoiceStatus } from '@prisma/client'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Video, Copy, Check } from 'lucide-react'
import { fmtNumber } from '~/utils/util'
import { QualityName } from '~/server/routers/stream'
import { SATS_PER_USD } from '~/utils/util'
import { ms } from 'date-fns/locale'

const formatUSD = (sats: number) => {
  const usd = sats / SATS_PER_USD
  return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const msatsPerSecToSatsPerMin = (msatsPerSec: number) => {
  return Math.floor((msatsPerSec * 60) / 1000)
}

// Prices in millisats/second
const qualityOptions = [
  { id: '1080p60fps', label: '1080p 60fps', uploadPrice: 500, downloadPrice: 250 },
  { id: '720p60fps', label: '720p 60fps', uploadPrice: 400, downloadPrice: 200 },
  { id: '720p30fps', label: '720p 30fps', uploadPrice: 300, downloadPrice: 150 },
  { id: '480p30fps', label: '480p 30fps', uploadPrice: 200, downloadPrice: 100 },
  { id: '360p30fps', label: '360p 30fps', uploadPrice: 150, downloadPrice: 75 },
  { id: '160p30fps', label: '160p 30fps', uploadPrice: 75, downloadPrice: 25 },
]

// TODO:
// - on close, cancel invoice, reset state?
// - remove click away handler?
// - refactor footer buttons, add loading state
// - error handling and toasts
export default function GoLiveModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])
  const [duration, setDuration] = useState(60) // Stream duration in minutes
  const [viewerDuration, setViewerDuration] = useState(60) // Typical viewer duration in minutes
  const [streamerProfits, setStreamerProfits] = useState<{ [key: string]: number }>({})
  const [totalViewerCosts, setTotalViewerCosts] = useState<{ [key: string]: number }>({})
  const [lightningAddress, setLightningAddress] = useState('')
  const [lightningAddressError, setLightningAddressError] = useState('')
  const [totalCost, setTotalCost] = useState(0)
  const [invoice, setInvoice] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)
  const [streamId, setStreamId] = useState('')
  const [expirationTime, setExpirationTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [copied, setCopied] = useState(false)

  const createStream = trpc.stream.createStream.useMutation({
    onSuccess: (data) => {
      // close()
      console.debug('Stream invoice created', data)
      // router.push({ pathname: '/dashboard', query: { streamId: data.streamId } })
      setStreamId(data.streamId)
      setInvoice(data.paymentRequest)
      setInvoiceId(data.invoiceId)
      // setView('payment')
      setStep(3)
      setIsInvoiceLoading(false)
    },
    onError: (err) => {
      console.error('Failed to create stream', err)
      // show error
      setIsInvoiceLoading(false)
    },
  })

  const { data: invoiceData, isLoading } = trpc.invoice.getInvoiceById.useQuery(invoiceId || '', {
    refetchOnWindowFocus: false,
    refetchInterval: 2 * 1000,
    enabled: !!invoiceId,
  })

  useEffect(() => {
    calculateTotalCost()
  }, [selectedQualities, duration])

  const calculateViewerCosts = () => {
    const costs = selectedQualities.reduce((acc, qualityId) => {
      const option = qualityOptions.find((q) => q.id === qualityId)
      const downloadPrice = option?.downloadPrice || 0
      const profit = streamerProfits[qualityId] || 0
      const totalPrice = downloadPrice + profit
      acc[qualityId] = msatsPerSecToSatsPerMin(totalPrice * viewerDuration)
      return acc
    }, {} as { [key: string]: number })
    setTotalViewerCosts(costs)
  }

  useEffect(() => {
    calculateViewerCosts()
  }, [viewerDuration, streamerProfits])

  const handleQualityToggle = (qualityId: string) => {
    setSelectedQualities((prev) =>
      prev.includes(qualityId) ? prev.filter((id) => id !== qualityId) : [...prev, qualityId],
    )
  }

  const calculateTotalCost = () => {
    const total = selectedQualities.reduce((sum, qualityId) => {
      const option = qualityOptions.find((q) => q.id === qualityId)
      return sum + (option?.uploadPrice || 0) * duration
    }, 0)
    setTotalCost(total)
  }

  const handleStreamerProfitChange = (qualityId: string, profit: number) => {
    setStreamerProfits((prev) => ({
      ...prev,
      [qualityId]: profit,
    }))
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return hours > 0 ? `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}` : `${minutes}m`
  }

  const quickAccessDurations = [
    { label: '1h', minutes: 60 },
    { label: '2h', minutes: 120 },
    { label: '4h', minutes: 240 },
    { label: '8h', minutes: 480 },
  ]

  const handleNext = () => {
    if (step === 1) {
      // Sort selectedQualities based on the order in qualityOptions
      const sortedSelectedQualities = qualityOptions
        .filter((option) => selectedQualities.includes(option.id))
        .map((option) => option.id)

      const initialStreamerProfits = sortedSelectedQualities.reduce((profits, qualityId) => {
        profits[qualityId] = 0 // Initialize profit to 0
        return profits
      }, {} as { [key: string]: number })
      setSelectedQualities(sortedSelectedQualities)
      setStreamerProfits(initialStreamerProfits)
      setStep(2)
    } else if (step === 2) {
      setIsInvoiceLoading(true)
      createStream.mutate({
        duration,
        lightningAddress: lightningAddress || undefined,
        qualities: selectedQualities.map((qualityId) => ({
          name: qualityId as QualityName,
          price: streamerProfits[qualityId] || 0,
        })),
      })
    } else {
      setIsOpen(false)
      setStep(1)
    }
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invoice).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // TODO: Zod form + onSubmit?
  const validateLightningAddress = (address: string) => {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    return regex.test(address)
  }

  const handleLightningAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value
    setLightningAddress(address)
    if (address && !validateLightningAddress(address)) {
      setLightningAddressError('Invalid lightning address format')
    } else {
      setLightningAddressError('')
    }
  }

  useEffect(() => {
    if (!invoiceData || !streamId) return
    console.debug('Invoice data', invoiceData)
    if (invoiceData.status === InvoiceStatus.SETTLED) {
      router.push({ pathname: '/dashboard', query: { streamId: streamId } })
      // TODO: reset state?
    }
  }, [invoiceData, streamId])

  return (
    <Dialog
      // open={true}
      onOpenChange={(open) => {
        // setIsOpen(open)
        if (!open) setStep(1)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-primary">
          <Video className="mr-2 h-4 w-4" />
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Configure Your Stream' : step === 2 ? 'Set Viewer Prices' : 'Payment Invoice'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Select quality options and set the duration for your stream.'
              : step === 2
              ? 'Set your profit margin for each quality option.'
              : 'Scan the QR code or copy the invoice to pay'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Quality Options</Label>
              {qualityOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.id}
                    checked={selectedQualities.includes(option.id)}
                    onCheckedChange={() => handleQualityToggle(option.id)}
                  />
                  <Label htmlFor={option.id} className="flex-grow text-sm">
                    {option.label}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {msatsPerSecToSatsPerMin(option.uploadPrice)} sats/min
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Label htmlFor="duration" className="text-base font-semibold">
                Stream Duration
              </Label>
              <Slider
                id="duration"
                min={1}
                max={480}
                step={1}
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{formatDuration(duration)}</span>
                <div className="flex space-x-2">
                  {quickAccessDurations.map((d) => (
                    <Button key={d.label} variant="outline" size="sm" onClick={() => setDuration(d.minutes)}>
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold">
                Total Cost: {fmtNumber(msatsPerSecToSatsPerMin(totalCost))} sats
                <span className="ml-1 text-sm text-muted-foreground">
                  ({formatUSD(msatsPerSecToSatsPerMin(totalCost))})
                </span>
              </p>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Set Your Profit Margin</Label>
              {selectedQualities.map((qualityId) => {
                const option = qualityOptions.find((q) => q.id === qualityId)
                const downloadPriceMsatsPerSec = option?.downloadPrice || 0
                const profitSatsPerMin = streamerProfits[qualityId] || 0
                const totalPriceSatsPerMin = msatsPerSecToSatsPerMin(downloadPriceMsatsPerSec) + profitSatsPerMin
                return (
                  <div key={qualityId} className="flex items-center space-x-2">
                    <Label htmlFor={`profit-${qualityId}`} className="w-24 text-sm">
                      {option?.label}
                    </Label>
                    <Input
                      id={`profit-${qualityId}`}
                      type="number"
                      value={profitSatsPerMin}
                      onChange={(e) => handleStreamerProfitChange(qualityId, Number(e.target.value))}
                      className="h-8 w-16"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">
                      +{msatsPerSecToSatsPerMin(downloadPriceMsatsPerSec)} = {fmtNumber(totalPriceSatsPerMin)} sats/min
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lightningAddress" className="text-sm font-semibold">
                Lightning Address
              </Label>
              <Input
                id="lightningAddress"
                type="text"
                value={lightningAddress}
                onChange={handleLightningAddressChange}
                placeholder="your@lightning.address"
              />
              {lightningAddressError && <p className="text-xs text-red-500">{lightningAddressError}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label htmlFor="viewerDuration">Typical Viewing Duration</Label>
                <span className="text-muted-foreground">{formatDuration(viewerDuration)}</span>
              </div>
              <Slider
                id="viewerDuration"
                min={1}
                max={240}
                step={1}
                value={[viewerDuration]}
                onValueChange={(value) => setViewerDuration(value[0])}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-semibold">Viewer Costs for {formatDuration(viewerDuration)}</Label>
              {selectedQualities.map((qualityId) => {
                const option = qualityOptions.find((q) => q.id === qualityId)
                const downloadPriceMsatsPerSec = option?.downloadPrice || 0
                const profitSatsPerMin = streamerProfits[qualityId] || 0
                const totalPriceSatsPerMin = msatsPerSecToSatsPerMin(downloadPriceMsatsPerSec) + profitSatsPerMin
                const costSatsPerMin = totalPriceSatsPerMin * viewerDuration
                return (
                  <div key={qualityId} className="flex items-center justify-between text-sm">
                    <span>{option?.label}</span>
                    <span className="font-semibold">
                      {fmtNumber(costSatsPerMin)} sats
                      <span className="ml-1 text-xs text-muted-foreground">({formatUSD(costSatsPerMin)})</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 py-4">
            <div className="flex justify-center">
              <QRCodeSVG value={invoice} level={'Q'} size={200} includeMargin />
            </div>
            <div className="flex items-center space-x-2">
              <Input readOnly value={invoice} className="font-mono text-xs" />
              <Button size="icon" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">Expires in: {formatTimeLeft(timeLeft)}</div>
          </div>
        )}

        <DialogFooter>
          {(step === 2 || step === 3) && (
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {/* <Button onClick={handleNext} disabled={step === 1 && selectedQualities.length === 0} size="sm">
            {step === 1 ? 'Next' : 'Save Configuration'}
          </Button> */}
          <Button onClick={handleNext} disabled={step === 1 && selectedQualities.length === 0} size="sm">
            {step === 3 ? 'Close' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
