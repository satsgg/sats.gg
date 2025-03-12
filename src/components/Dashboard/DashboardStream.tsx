import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Copy, Eye, EyeOff } from 'lucide-react'

export default function DashboardStream({
  hlsUrl,
  streamKey,
  rtmpUrl,
}: {
  hlsUrl: string
  streamKey?: string
  rtmpUrl?: string | null
}) {
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [fullRtmpUrl, setFullRtmpUrl] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (rtmpUrl) {
      const fullRtmpUrl = `rtmp://${rtmpUrl}/live`
      setFullRtmpUrl(fullRtmpUrl)
    }
  }, [rtmpUrl])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    })
  }

  return (
    <div className="w-full max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Stream</h1>
        <p className="mt-1 text-muted-foreground">
          Your personal streaming credentials. Keep these private and secure.
        </p>
      </div>
      <div className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="hls-url">HLS URL</Label>
          <div className="flex items-center space-x-2">
            <Input id="hls-url" value={hlsUrl} readOnly className="font-mono" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(hlsUrl, 'HLS URL')}
              title="Copy HLS URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rtmp-url">RTMP URL</Label>
          <div className="flex items-center space-x-2">
            <Input id="rtmp-url" value={fullRtmpUrl} readOnly className="font-mono" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(fullRtmpUrl, 'RTMP URL')}
              title="Copy RTMP URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Use this URL in your streaming software (OBS, Streamlabs, etc.)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stream-key">Stream Key</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="stream-key"
              type={showStreamKey ? 'text' : 'password'}
              value={streamKey}
              readOnly
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowStreamKey(!showStreamKey)}
              title={showStreamKey ? 'Hide Stream Key' : 'Show Stream Key'}
            >
              {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(streamKey ?? '', 'Stream Key')}
              title="Copy Stream Key"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Keep your stream key private. Never share it with anyone.</p>
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            To stream, combine your RTMP URL and Stream Key in your streaming software. For example: {fullRtmpUrl}/
            {streamKey?.substring(0, 5)}...
          </p>
        </div>
      </div>
    </div>
  )
}
