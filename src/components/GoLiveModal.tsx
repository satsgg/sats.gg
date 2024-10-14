import React, { useState, useEffect } from 'react'
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

const qualityOptions = [
  { id: '1080p60', label: '1080p 60fps', basePrice: 10 },
  { id: '720p60', label: '720p 60fps', basePrice: 8 },
  { id: '720p30', label: '720p 30fps', basePrice: 6 },
  { id: '480p30', label: '480p 30fps', basePrice: 4 },
  { id: '180p30', label: '180p 30fps', basePrice: 2 },
]

// TODO:
// - Hook up to backend
export default function GoLiveModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])
  const [duration, setDuration] = useState(60) // Stream duration in minutes
  const [viewerDuration, setViewerDuration] = useState(60) // Typical viewer duration in minutes
  const [streamerProfits, setStreamerProfits] = useState<{ [key: string]: number }>({})
  const [totalCost, setTotalCost] = useState(0)
  const [invoice, setInvoice] = useState('')
  const [expirationTime, setExpirationTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    calculateTotalCost()
  }, [selectedQualities, duration])

  const handleQualityToggle = (qualityId: string) => {
    setSelectedQualities((prev) =>
      prev.includes(qualityId) ? prev.filter((id) => id !== qualityId) : [...prev, qualityId],
    )
  }

  const calculateTotalCost = () => {
    const total = selectedQualities.reduce((sum, qualityId) => {
      const option = qualityOptions.find((q) => q.id === qualityId)
      return sum + (option?.basePrice || 0) * duration
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
    { label: '30m', minutes: 30 },
    { label: '1h', minutes: 60 },
    { label: '2h', minutes: 120 },
    { label: '3h', minutes: 180 },
  ]

  // const handleNext = () => {
  //   if (step === 1) {
  //     const initialStreamerProfits = selectedQualities.reduce((profits, qualityId) => {
  //       profits[qualityId] = 0 // Initialize profit to 0
  //       return profits
  //     }, {} as { [key: string]: number })
  //     setStreamerProfits(initialStreamerProfits)
  //     setStep(2)
  //   } else {
  //     setIsOpen(false)
  //     setStep(1)
  //   }
  // }

  // const handleBack = () => {
  //   setStep(1)
  // }

  const handleNext = () => {
    if (step === 1) {
      const initialStreamerProfits = selectedQualities.reduce((profits, qualityId) => {
        profits[qualityId] = 0 // Initialize profit to 0
        return profits
      }, {} as { [key: string]: number })
      setStreamerProfits(initialStreamerProfits)
      setStep(2)
    } else if (step === 2) {
      // Generate a dummy invoice and set expiration time (15 minutes from now)
      const dummyInvoice =
        'lnbc1500n1ps36h3upp5cjgufucxj6q6x35zyl5xyxmkgauejrfzpwdlx8zsyng293zxu9qsdqqcqzpgxqyz5vqsp5usyc4lk9chsfp53kvcnvq456ganh60d89reykdngsmtj6yw3n5uq9qyyssqgcpvwf6ppgf68tnd3sqhqtqwxcmq9d7lxqlct9lzp6535l5h9ztr84m3mm60takx7r2j8hfnwtndwq4mlpasfqpcehxjp0ypdeqcqwgxsxq'
      setInvoice(dummyInvoice)
      setExpirationTime(Math.floor(Date.now() / 1000) + 15 * 60) // 15 minutes from now
      setStep(3)
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
            <div className="space-y-4">
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
                  <span className="text-sm text-muted-foreground">{option.basePrice} sats/min</span>
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
              <p className="text-lg font-semibold">Total Cost: {fmtNumber(totalCost)} sats</p>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Set Your Profit Margin</Label>
              {selectedQualities.map((qualityId) => {
                const option = qualityOptions.find((q) => q.id === qualityId)
                const basePrice = option?.basePrice || 0
                const profit = streamerProfits[qualityId] || 0
                const totalPrice = basePrice + profit
                return (
                  <div key={qualityId} className="flex items-center space-x-2">
                    <Label htmlFor={`profit-${qualityId}`} className="w-20 text-sm">
                      {option?.label}
                    </Label>
                    <Input
                      id={`profit-${qualityId}`}
                      type="number"
                      value={profit}
                      onChange={(e) => handleStreamerProfitChange(qualityId, Number(e.target.value))}
                      className="h-8 w-16"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">
                      +{basePrice} = {totalPrice} sats/min
                    </span>
                  </div>
                )
              })}
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
                const basePrice = option?.basePrice || 0
                const profit = streamerProfits[qualityId] || 0
                const totalPrice = basePrice + profit
                const cost = totalPrice * viewerDuration
                return (
                  <div key={qualityId} className="flex items-center justify-between text-sm">
                    <span>{option?.label}</span>
                    <span className="font-semibold">{cost} sats</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 py-4">
            <div className="flex justify-center">
              {/* <QRCode value={invoice} size={200} /> */}
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
