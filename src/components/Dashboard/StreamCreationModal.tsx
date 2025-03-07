'use client'

import { useState, useEffect } from 'react'
import { StreamStatus } from '@prisma/client'
import { trpc } from '~/utils/trpc'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Copy, Check } from 'lucide-react'

// const StreamCreationModal = ({ streamId, onClose }: { streamId: string; onClose: () => void }) => {
export default function StreamCreationModal({
  streamId,
  isOpen,
  setIsOpen,
}: {
  streamId: string | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}) {
  const [isChannelReady, setIsChannelReady] = useState(false)
  const [isUrlCopied, setIsUrlCopied] = useState(false)
  const [isKeyCopied, setIsKeyCopied] = useState(false)

  // TODO: Ensure streamId belongs to the current user
  const { data, isLoading } = trpc.stream.getStreamById.useQuery(streamId ?? '', {
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 1000,
    enabled: isOpen && !isChannelReady && streamId != null,
  })

  // console.debug('!!streamId', !!streamId)
  // console.debug('isOpen', isOpen)
  // console.debug('data', data)
  // console.debug('isChannelReady', isChannelReady)
  useEffect(() => {
    if (data?.status === StreamStatus.READY) {
      console.debug('setting isChannelReady to true')
      setIsChannelReady(true)
    }
  }, [data?.status])

  const handleOpenChange = (open: boolean) => {
    handleClose()
  }

  const handleClose = () => {
    setIsChannelReady(false)
    setIsOpen(false)
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`rtmp://${data?.rtmpUrl}/live`).then(() => {
      setIsUrlCopied(true)
      setTimeout(() => setIsUrlCopied(false), 2000)
    })
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(data?.streamKey ?? '').then(() => {
      setIsKeyCopied(true)
      setTimeout(() => setIsKeyCopied(false), 2000)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Your Channel</DialogTitle>
          <DialogDescription>
            {!isChannelReady
              ? 'Your live streaming channel is being configured. This process may take up to 2 minutes.'
              : 'Your live streaming channel is ready! Here are your RTMP server details.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!isChannelReady ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Configuring your channel...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rtmpUrl" className="text-right">
                  RTMP URL
                </Label>
                <div className="col-span-3 flex space-x-2">
                  <Input id="rtmpUrl" value={`rtmp://${data?.rtmpUrl}/live`} className="" readOnly />
                  <Button type="button" variant="outline" className="" onClick={handleCopyUrl}>
                    {isUrlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  Stream Key
                </Label>
                <div className="col-span-3 flex space-x-2">
                  <Input id="apiKey" value={data?.streamKey} className="" readOnly />
                  <Button type="button" variant="outline" className="" onClick={handleCopyKey}>
                    {isKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Not sure what to do with these details? Check our{' '}
                  <a href="/docs/live-streaming" className="text-primary hover:underline">
                    live streaming documentation
                  </a>{' '}
                  for more information.
                </p>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Important:</strong> Please keep this page open in your browser. It's needed to sign nostr
                  events (kind 30311 live event data) that will be broadcasted to relays. This allows viewers to
                  discover and find your stream link.
                </p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
