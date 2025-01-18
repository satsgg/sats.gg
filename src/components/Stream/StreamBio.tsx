import { displayName } from '~/utils/nostr'
import { UserMetadataStore } from '~/store/db'
import useSettingsStore from '~/hooks/useSettingsStore'
import ParticipantAvatar from '../ParticipantAvatar'
import ParticipantPopupRow from '../ParticipantPopupRow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Heart, HeartCrack, Share2, Users, Clock, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ShareDialog } from './ShareDialog'

const maxVisibleParticipants = 2

const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / (3600 * 24))
  const hours = Math.floor((seconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}

export const StreamBio = ({
  channelPubkey,
  providerPubkey,
  streamStreaming,
  streamIdentifier,
  channelProfile,
  channelProfileIsLoading,
  streamTitle,
  streamStatus,
  participants,
  tags,
  viewerCount,
  starts,
  ends,
  relays,
  zapInvoice,
  setZapInvoice,
  setShowZapModule,
}: {
  channelPubkey: string
  providerPubkey: string | undefined
  streamStreaming: string | undefined
  streamIdentifier: string | undefined
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  streamTitle: string | null | undefined
  streamStatus: string | undefined
  participants: string[] | undefined
  tags: string[] | undefined
  viewerCount: number | undefined
  starts: string | undefined
  ends: string | undefined
  relays: string[] | undefined
  zapInvoice: string | null
  setZapInvoice: (invoice: string | null) => void
  setShowZapModule: (show: boolean) => void
}) => {
  const [follows, setFollows] = useSettingsStore((state) => [state.follows, state.setFollows])
  const followsUser = follows.follows.includes(channelPubkey)
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [showShareDialog, setShowShareDialog] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mb-4 bg-background p-4">
      <div className="flex items-start space-x-4">
        {/* Avatar Column */}
        <div className="flex-shrink-0">
          <div className="relative w-16">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={channelProfile?.picture} alt={'Streamer profile picture'} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            {streamStatus === 'live' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 transform rounded-md bg-red-500 px-1 py-0.5 text-xs font-bold text-white">
                LIVE
              </span>
            )}
          </div>

          {/* Participants */}
          <div className="mt-2">
            <div className="flex justify-center -space-x-2 overflow-hidden">
              {participants?.slice(0, maxVisibleParticipants).map((participant, index) => (
                <ParticipantAvatar key={index} pubkey={participant} />
              ))}
              {participants && participants.length > maxVisibleParticipants && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background">
                        <span className="text-xs font-medium">+{participants.length - maxVisibleParticipants}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="center"
                      className="border border-border bg-background p-2 text-foreground"
                    >
                      <div className="space-y-2">
                        {participants.slice(maxVisibleParticipants).map((participant, index) => (
                          <ParticipantPopupRow key={index} pubkey={participant} />
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Stream Info Column */}
        <div className="min-w-0 flex-grow space-y-1 pr-4">
          <h1 className="truncate text-xl font-bold text-foreground">
            {!channelProfileIsLoading && displayName(channelPubkey, channelProfile)}
          </h1>
          <p className="truncate text-lg text-foreground">{streamTitle}</p>
          <div className="flex flex-wrap gap-2">
            {tags?.slice(0, 4).map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons and Viewer Count Column */}
        <div className="w-[280px] flex-shrink-0 space-y-2">
          <div className="flex justify-end space-x-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`group transition-all duration-300 ease-in-out ${followsUser ? 'w-9 p-0' : 'w-24'}`}
                      aria-label={followsUser ? 'Unfollow' : 'Follow'}
                    >
                      {followsUser ? (
                        <>
                          <Heart className="h-5 w-5 fill-current text-foreground transition-all duration-300 group-hover:hidden" />
                          <HeartCrack className="hidden h-5 w-5 text-foreground transition-all duration-300 group-hover:block" />
                        </>
                      ) : (
                        <>
                          <Heart className="mr-2 h-4 w-4 text-red-500 transition-all duration-300 group-hover:scale-125 group-hover:fill-current" />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {followsUser && (
                  <TooltipContent
                    side="top"
                    align="center"
                    className="border border-border bg-background text-foreground"
                  >
                    Unfollow
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button size="sm" variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button size="sm" className="group">
              <Zap className="mr-2 h-4 w-4 group-hover:animate-zap" />
              1.2k sats
            </Button>
          </div>
          <div className="flex flex-col items-end space-y-1 text-sm text-muted-foreground">
            {viewerCount !== undefined && Number.isInteger(viewerCount) && streamStatus === 'live' && (
              <div className="flex w-full items-center justify-end font-semibold text-red-400">
                <Users className="mr-1 h-4 w-4" strokeWidth={2.5} />
                <span className="text-right">{viewerCount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex w-full justify-end">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span className="font-mono">
                  {starts && formatDuration(Math.floor(Number(currentTime) / 1000 - Number(starts)))}
                  {ends && starts && ' / '}
                  {ends &&
                    (Number(ends) * 1000 < currentTime
                      ? 'Ended'
                      : formatDuration(Math.floor(Number(ends) - currentTime / 1000)))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Streamer */}
      <div className="mt-4 mb-4 rounded-lg border border-border bg-background p-4">
        <h2 className="mb-2 text-lg font-semibold">
          About {!channelProfileIsLoading && displayName(channelPubkey, channelProfile)}
        </h2>
        <p className="text-foreground">{channelProfile?.about}</p>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        streamIdentifier={streamIdentifier}
        streamTitle={streamTitle}
        streamStreaming={streamStreaming}
        pubkey={providerPubkey || channelPubkey}
        relays={relays}
      />
    </div>
  )
}
