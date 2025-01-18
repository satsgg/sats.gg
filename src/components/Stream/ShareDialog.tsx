import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, Code, Twitter } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelPubkey: string
  streamIdentifier: string | undefined
  streamTitle?: string | null
}

export const ShareDialog = ({ open, onOpenChange, channelPubkey, streamIdentifier, streamTitle }: ShareDialogProps) => {
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

  const handleShareTwitter = () => {
    const text = streamTitle ? `${streamTitle}\n` : ''
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
      url,
    )}`
    window.open(twitterUrl, '_blank')
  }

  const handleShareNostr = async () => {
    if (!window.nostr) {
      alert('Nostr extension not found. Please install a Nostr extension like Alby or nos2x.')
      return
    }

    try {
      const content = streamTitle ? `${streamTitle}\n${window.location.href}` : window.location.href

      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['r', window.location.href]],
        content: content,
        pubkey: '', // Will be filled by the extension
      }

      await window.nostr.signEvent(event)
      // The extension will handle publishing to relays
      alert('Shared to Nostr!')
    } catch (error) {
      console.error('Error sharing to Nostr:', error)
      alert('Failed to share to Nostr. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Stream</DialogTitle>
          <DialogDescription>Share this stream with others</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Social Share Buttons */}
          <div className="flex items-center justify-start space-x-2">
            <Button variant="outline" onClick={handleShareTwitter} className="space-x-2">
              <Twitter className="h-4 w-4" />
              <span>Share on Twitter</span>
            </Button>
            <Button variant="outline" onClick={handleShareNostr} className="space-x-2">
              <div className="h-4 w-4">⚡️</div>
              <span>Share on Nostr</span>
            </Button>
          </div>

          <Separator className="my-2" />

          {/* Embed Section */}
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

          {/* URL Section */}
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

          {/* HLS URL Section */}
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
