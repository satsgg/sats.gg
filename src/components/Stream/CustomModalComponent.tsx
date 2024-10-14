import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   // DialogContentPortal,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
//   DialogPortal,
// } from '@/components/ui/dialog'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Copy, Check, X } from 'lucide-react'

// Quality options with their prices in sats per minute
const qualityOptions = [
  { value: '1080p60', label: '1080p 60fps', price: 10 },
  { value: '1080p30', label: '1080p 30fps', price: 8 },
  { value: '720p30', label: '720p 30fps', price: 5 },
]

// Simulated function to generate an invoice
const generateInvoice = (quality: string, durationMinutes: number, totalSats: number) => {
  return `invoice-${quality}-${durationMinutes}m-${totalSats}sats-${Date.now()}`
}

// Simulated exchange rate (1 USD = 100,000 sats)
const SATS_PER_USD = 100000

interface CustomModalComponentProps {
  vjsBridgeComponent: {
    player: () => {
      pause: () => void
      el: () => HTMLElement
    }
  }
  show: boolean
  onClose: () => void
}

// TODO:
// - Get quality levels from videojs player
// - integrate l402
const CustomModalComponent: React.FC<CustomModalComponentProps> = ({ vjsBridgeComponent, show, onClose }) => {
  if (!show) return null
  const [isOpen, setIsOpen] = useState(true)
  const [selectedQuality, setSelectedQuality] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(60) // Default to 60 minutes
  const [totalPrice, setTotalPrice] = useState(0)
  const [invoice, setInvoice] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [expirationTime, setExpirationTime] = useState(0)
  // const videoRef = useRef<HTMLDivElement>(null)

  // const [portalRef, setPortalRef] = React.useState<HTMLDivElement | null>(null)

  const handlePurchase = () => {
    if (selectedQuality && selectedDuration) {
      const newInvoice = generateInvoice(selectedQuality, selectedDuration, totalPrice)
      setInvoice(newInvoice)
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

  const formatUSD = (sats: number) => {
    const usd = sats / SATS_PER_USD
    return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const quickAccessDurations = [
    { label: '5m', minutes: 5 },
    { label: '10m', minutes: 10 },
    { label: '30m', minutes: 30 },
    { label: '1h', minutes: 60 },
  ]

  // return (
  //   <div className="relative mx-auto w-full max-w-3xl p-4">
  //     <p>hi</p>
  //   </div>
  // )

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      {isOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90%] w-[90%] max-w-[500px] overflow-y-auto rounded-lg bg-background text-foreground shadow-lg">
            <div className="relative p-6">
              <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setIsOpen(false)}>
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
                        onValueChange={setSelectedQuality}
                        value={selectedQuality}
                        className="grid grid-cols-3 gap-2"
                      >
                        {qualityOptions.map((option) => (
                          <Label
                            key={option.value}
                            className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center ${
                              selectedQuality === option.value ? 'bg-primary text-primary-foreground' : 'bg-background'
                            } cursor-pointer hover:bg-accent hover:text-accent-foreground`}
                          >
                            <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                            <span className="text-sm font-medium">{option.label}</span>
                            <span className="text-xs">{option.price} sats/min</span>
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
                          onValueChange={(value) => setSelectedDuration(value[0])}
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
                    <p className="text-xs text-gray-500">Having issues? Contact support</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // return (
  //   <div className="relative h-full w-full">
  //     <Dialog
  //       modal
  //       open={show}
  //       onOpenChange={(open) => {
  //         console.debug('CustomModalComponent: onOpenChange', open)
  //         setIsOpen(open)
  //         if (!open) {
  //           setShowQRCode(false)
  //           setInvoice('')
  //           setIsCopied(false)
  //           setExpirationTime(0)
  //           handleClose()
  //         }
  //       }}
  //     >
  //       {/* <DialogPortal > */}
  //       {/* <DialogContentPortal container={portalRef} className="sm:max-w-[425px]"> */}
  //       <DialogContent className="sm:max-w-[425px]">
  //         {!showQRCode ? (
  //           <>
  //             <DialogHeader>
  //               <DialogTitle>Select Video Quality and Duration</DialogTitle>
  //               <DialogDescription>Choose the quality variant and duration you want to purchase.</DialogDescription>
  //             </DialogHeader>

  //             <div className="grid gap-6 py-4">
  //               <div className="grid gap-2">
  //                 <Label htmlFor="quality">Quality</Label>
  //                 <Select onValueChange={setSelectedQuality} value={selectedQuality}>
  //                   <SelectTrigger>
  //                     <SelectValue placeholder="Select quality" />
  //                   </SelectTrigger>
  //                   <SelectContent>
  //                     {qualityOptions.map((option) => (
  //                       <SelectItem key={option.value} value={option.value}>
  //                         {option.label} - {option.price} sats/min
  //                       </SelectItem>
  //                     ))}
  //                   </SelectContent>
  //                 </Select>
  //               </div>

  //               <div className="grid gap-2">
  //                 <Label htmlFor="duration">Duration</Label>
  //                 <div className="space-y-4">
  //                   <Slider
  //                     min={1}
  //                     max={480}
  //                     step={1}
  //                     value={[selectedDuration]}
  //                     onValueChange={(value) => setSelectedDuration(value[0])}
  //                   />
  //                   <div className="text-center text-sm text-gray-500">{formatDuration(selectedDuration)}</div>
  //                   <div className="flex justify-between gap-2">
  //                     {quickAccessDurations.map((duration) => (
  //                       <Button
  //                         key={duration.label}
  //                         variant="outline"
  //                         size="sm"
  //                         onClick={() => setSelectedDuration(duration.minutes)}
  //                         className="flex-1"
  //                       >
  //                         {duration.label}
  //                       </Button>
  //                     ))}
  //                   </div>
  //                 </div>
  //               </div>

  //               <div className="text-center">
  //                 <p className="text-lg font-semibold">Total Price: {totalPrice} sats</p>
  //                 <p className="text-sm text-gray-500">Approximately {formatUSD(totalPrice)}</p>
  //               </div>
  //             </div>

  //             <DialogFooter>
  //               <Button onClick={handlePurchase} disabled={!selectedQuality || !selectedDuration}>
  //                 Generate Invoice
  //               </Button>
  //             </DialogFooter>
  //           </>
  //         ) : (
  //           <>
  //             <DialogHeader>
  //               <DialogTitle>Scan QR Code to Pay</DialogTitle>
  //               <DialogDescription>Use your preferred payment app to scan the QR code below.</DialogDescription>
  //             </DialogHeader>

  //             <div className="flex flex-col items-center justify-center py-6">
  //               <QRCodeSVG value={invoice} size={200} />
  //               <div className="mt-4 flex w-full items-center space-x-2">
  //                 <Input readOnly value={invoice} className="flex-grow" />
  //                 <Button size="icon" onClick={handleCopy} variant="outline">
  //                   {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
  //                   <span className="sr-only">{isCopied ? 'Copied' : 'Copy'}</span>
  //                 </Button>
  //               </div>
  //               <div className="mt-4 text-center">
  //                 <p className="text-lg font-semibold">Total: {totalPrice} sats</p>
  //                 <p className="text-sm text-gray-500">Approximately {formatUSD(totalPrice)}</p>
  //               </div>
  //               <div className="mt-2 text-sm text-gray-500">
  //                 Invoice expires in: {formatExpirationTime(expirationTime)}
  //               </div>
  //             </div>

  //             <DialogFooter>
  //               <Button onClick={handleBack} variant="outline">
  //                 <ArrowLeft className="mr-2 h-4 w-4" />
  //                 Back
  //               </Button>
  //             </DialogFooter>
  //           </>
  //         )}
  //       </DialogContent>
  //       {/* </DialogContentPortal> */}
  //       {/* </DialogPortal> */}
  //     </Dialog>
  //   </div>
  // )
}

export default CustomModalComponent
