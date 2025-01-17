import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, Code } from 'lucide-react'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelPubkey: string
  streamIdentifier: string | undefined
}

export const ShareDialog = ({ open, onOpenChange, channelPubkey, streamIdentifier }: ShareDialogProps) => {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedHls, setCopiedHls] = useState(false)

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    })
  }

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${window.location.href}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    })
  }

  const handleCopyHls = () => {
    // TODO: Replace with actual HLS URL construction
    const hlsUrl = `${window.location.origin}/hls/${channelPubkey}/${streamIdentifier}/stream.m3u8`
    navigator.clipboard.writeText(hlsUrl).then(() => {
      setCopiedHls(true)
      setTimeout(() => setCopiedHls(false), 2000)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Stream</DialogTitle>
          <DialogDescription>Share this stream with others</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span className="text-sm font-medium">Embed</span>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={`<iframe src="${window.location.href}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`}
            />
            <Button size="icon" variant="outline" onClick={handleCopyEmbed}>
              {copiedEmbed ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">Copy URL</span>
          </div>
          <div className="flex items-center space-x-2">
            <Input readOnly value={window.location.href} />
            <Button size="icon" variant="outline" onClick={handleCopyUrl}>
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">HLS URL</span>
          </div>
          <div className="flex items-center space-x-2">
            <Input readOnly value={`${window.location.origin}/hls/${channelPubkey}/${streamIdentifier}/stream.m3u8`} />
            <Button size="icon" variant="outline" onClick={handleCopyHls}>
              {copiedHls ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
