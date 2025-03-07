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
// import { ShareDialog } from './ShareDialog'
import useAuthStore from '~/hooks/useAuthStore'
import { useProfile } from '~/hooks/useProfile'
import { ShareDialog } from '../Stream/ShareDialog'

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

export default function DashboardStreamBio({
  // streamStatus,
  // setStreamStatus,
  isStreamLive,
  setIsStreamLive,
  participants,
  title,
  tags,
  viewerCount,
  // starts,
  streamStartedAt,
  expiresAt,
  expired,
}: {
  // streamStatus: string
  // setStreamStatus: Function
  isStreamLive: boolean
  setIsStreamLive: Function
  participants: string[]
  title: string
  tags: string[]
  viewerCount: number
  // starts: number
  streamStartedAt: number
  expiresAt: number
  expired: boolean
}) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [user, pubkey, npub, view, logout] = useAuthStore((state) => [
    state.user,
    state.pubkey,
    state.npub,
    state.view,
    state.logout,
  ])
  const { profile, isLoading: profileIsLoading } = useProfile(pubkey)

  // Number(ends) * 1000 < currentTime
  // useEffect(() => {
  //   console.debug('ends', ends, 'ends * 1000', Number(ends) * 1000, 'currentTime', currentTime)
  //   console.log(Number(ends) < currentTime)
  // }, [ends, currentTime])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    // <div className="mb-4 bg-background p-4">
    <div className="mb-4 bg-background p-4">
      {/* <div className="flex items-start space-x-4"> */}
      <div className="flex items-start space-x-4">
        {/* Avatar Column */}
        <div className="flex-shrink-0">
          <div className="relative w-16">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={profile?.picture} alt={'Streamer profile picture'} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            {isStreamLive && (
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
            {!profileIsLoading && displayName(pubkey!, profile)}
          </h1>
          <p className="truncate text-lg text-foreground">{title}</p>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {/* </div> */}

        {/* Action Buttons and Viewer Count Column */}
        <div className="w-[280px] flex-shrink-0 space-y-2">
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsStreamLive(!isStreamLive)}
              disabled={expired}
              title={expired ? 'Stream has expired' : ''}
            >
              <span
                className={`mr-2 inline-block h-2 w-2 rounded-full ${isStreamLive ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              {isStreamLive ? 'Stop Stream' : 'Start Stream'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          <div className="flex flex-col items-end space-y-1 text-sm text-muted-foreground">
            {viewerCount !== undefined && Number.isInteger(viewerCount) && isStreamLive && (
              <div className="flex w-full items-center justify-end font-semibold text-red-400">
                <Users className="mr-1 h-4 w-4" strokeWidth={2.5} />
                <span className="text-right">{viewerCount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex w-full justify-end">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span className="font-mono">
                  {expired ? (
                    'Ended'
                  ) : (
                    <>
                      {isStreamLive && formatDuration(Math.floor((currentTime - streamStartedAt) / 1000))}
                      {isStreamLive && ' / '}
                      {formatDuration(Math.floor((expiresAt - currentTime) / 1000))}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* </div> */}

        {/* <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        streamIdentifier={streamIdentifier}
        streamTitle={title}
        streamStreaming={streamStreaming}
        pubkey={pubkey}
        relays={relays}
      /> */}
      </div>
    </div>
  )
}
