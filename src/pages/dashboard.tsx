import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import useAuthStore from '~/hooks/useAuthStore'
import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
// import StreamCreationModal from '~/components/StreamCreationModal'
import StreamCreationModal from '~/components/Dashboard/StreamCreationModal'
import Settings from '~/components/Dashboard/Settings'
import { trpc } from '~/utils/trpc'
import { Button } from '~/components/ui/button'
import { ChevronUp, ChevronDown, Bell, MessageSquare, Badge } from 'lucide-react'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useStream } from '~/hooks/useStream'
import { useProfile } from '~/hooks/useProfile'
import NewChat from '~/components/Chat/NewChat'
import { createStreamEvent, displayName } from '~/utils/nostr'
import { nostrClient } from '~/nostr/NostrClient'
import { Event as NostrEvent, verifySignature, validateEvent } from 'nostr-tools'
import VideoPlayer from '~/components/Stream/Player'
import { TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { Tooltip } from '~/components/ui/tooltip'
import ParticipantAvatar from '~/components/ParticipantAvatar'
import { TooltipContent } from '~/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import ParticipantPopupRow from '~/components/ParticipantPopupRow'
import DashboardStreamBio from '~/components/Dashboard/DashboardStreamBio'
import Relays from '~/components/Dashboard/Relays'

const maxVisibleParticipants = 4

const Dashboard = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [streamId, setStreamId] = useState<string>('')
  const [currentView, setCurrentView] = useState('dashboard')
  // const [streamStatus, setStreamStatus] = useState<'live' | 'ended'>('ended')
  const [isStreamLive, setIsStreamLive] = useState(false)
  // const [ends, setEnds] = useState<number>(0) //milliseconds
  const [expired, setExpired] = useState(true)
  const [streamStartedAt, setStreamStartedAt] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)

  const [user, pubkey, npub, view, logout] = useAuthStore((state) => [
    state.user,
    state.pubkey,
    state.npub,
    state.view,
    state.logout,
  ])
  const { profile, isLoading: profileIsLoading } = useProfile(pubkey)

  // TODO: Ensure streamId belongs to the current user
  const { data: streamData, isLoading } = trpc.stream.getCurrentStream.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000,
    enabled: !showModal,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // const stream = useStream(pubkey ?? '', data?.id)
  // console.debug('stream', stream)

  const publishStreamEvent = async (status: 'live' | 'ended') => {
    if (!streamData?.id) return

    const now = Math.floor(Date.now() / 1000)
    const event = createStreamEvent(pubkey ?? '', streamData.id, now, status)
    console.debug('kind 30311 event', status, event)
    try {
      const signedEvent: NostrEvent | null = await window.nostr.signEvent(event)
      if (!signedEvent) throw new Error('Failed to sign message')
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')
      console.debug('status', status, 'signed event', signedEvent)
      // nostrClient.publish(signedEvent)
    } catch (error) {
      console.error('Error publishing stream event', error)
    }
  }

  useEffect(() => {
    if (router.isReady) {
      const { streamId } = router.query
      if (streamId) {
        setShowModal(true)
        setStreamId(streamId as string)
        // Remove the query parameters from the URL without triggering a navigation
        router.replace('/dashboard', undefined, { shallow: true })
      }
    }
  }, [router.isReady, router.query])
  // console.debug('streamData', streamData)

  // useEffect(() => {
  //   if (!streamData?.id || streamData.status !== 'READY') {
  //     return
  //   }

  //   // TODO: Fix this to actual start value
  //   const now = Math.floor(Date.now() / 1000)

  //   const publishEvent = async (status: 'live' | 'ended') => {
  //     console.debug('publishing kind 30311', status)
  //     const event = createStreamEvent(pubkey ?? '', streamData.id, now, status)
  //     console.debug('kind 30311 event', event)
  //     try {
  //       const signedEvent: NostrEvent | null = await window.nostr.signEvent(event)
  //       if (!signedEvent) throw new Error('Failed to sign message')
  //       let ok = validateEvent(signedEvent)
  //       if (!ok) throw new Error('Invalid event')
  //       let veryOk = verifySignature(signedEvent)
  //       if (!veryOk) throw new Error('Invalid signature')
  //       nostrClient.publish(signedEvent)
  //     } catch (error) {
  //       console.error('Error publishing stream event', error)
  //     }
  //   }

  //   publishEvent('live') // Initial publish

  //   const interval = setInterval(publishEvent, 30 * 1000)

  //   return () => {
  //     clearInterval(interval)
  //     publishEvent('ended')
  //   }
  // }, [streamData?.id])

  useEffect(() => {
    if (!streamData?.expiresAt) return
    const expired = currentTime > streamData.expiresAt.getTime()
    console.debug('streamData.expiresAt', streamData.expiresAt.getTime(), 'currentTime', currentTime)
    console.debug('expired', expired)
    setExpired(expired)
    if (isStreamLive && expired) {
      // Publish ended event if stream was live and expired
      publishStreamEvent('ended')
      setIsStreamLive(false)
    }
  }, [streamData?.expiresAt, currentTime, isStreamLive])

  useEffect(() => {
    if (isStreamLive) {
      setStreamStartedAt(Date.now())
      setExpired(false)
      // Publish initial live event
      publishStreamEvent('live')

      // Set up interval to keep publishing live events
      const interval = setInterval(() => {
        if (!expired) {
          publishStreamEvent('live')
        }
      }, 30 * 1000) // Every 30 seconds

      return () => {
        clearInterval(interval)
        // Publish ended event when component unmounts or stream stops
        if (!expired) {
          publishStreamEvent('ended')
        }
      }
    } else {
      // If stream was manually stopped, publish ended event
      if (!expired && streamStartedAt > 0) {
        publishStreamEvent('ended')
      }
    }
  }, [isStreamLive])

  const renderContent = () => {
    if (currentView === 'settings') {
      return (
        <Settings
          streamId={streamData?.id}
          streamTitle={streamData?.title}
          streamImage={streamData?.image}
          streamHashtags={streamData?.t}
          streamParticipants={streamData?.participants}
        />
      )
    }

    if (currentView === 'relays') {
      return <Relays />
    }

    if (currentView === 'streams') {
      return <div>Streams View Coming Soon</div>
    }

    const hlsUrl = streamData?.id ? `https://d1994e6vyyhuyl.cloudfront.net/${streamData.id}/stream.m3u8` : undefined

    // Default dashboard view
    const videoJsOptions = {
      autoplay: false,
      controls: true,
      responsive: true,
      fill: true,
      liveui: false,
      // inactivityTimeout: 100,
      playsinline: true,
      poster: streamData?.image || undefined,
      preload: 'none',
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,
          // prevent playlist from being excluded when we get a errors on it (402...)
          // need it to be smarter. Actual broken playlists won't get excluded now
          playlistExclusionDuration: 0,
          // allowSeeksWithinUnsafeLiveWindow: true,
        },
      },
      sources: hlsUrl
        ? [
            {
              src: hlsUrl,
              type: 'application/x-mpegURL',
              customTagParsers: [
                {
                  expression: /#EXT-X-PRICE:(\d+)/,
                  customType: 'price',
                  dataParser: (line: string) => {
                    const match = /#EXT-X-PRICE:(\d+)/.exec(line)
                    return match && match[1] ? parseInt(match[1], 10) : null
                  },
                  segment: true,
                },
              ],
            },
          ]
        : [],
      plugins: {},
    }
    return (
      <>
        {/* Rest of dashboard view */}
        <div className="w-full flex-1 overflow-y-auto">
          <div
            id="streamWrapper"
            className="relative aspect-video max-h-[calc(100vh-9rem)] w-full sm:border-b sm:border-solid sm:border-gray-500"
          >
            <VideoPlayer options={videoJsOptions} />
          </div>

          <DashboardStreamBio
            // streamStatus={streamStatus}
            // setStreamStatus={setStreamStatus}
            isStreamLive={isStreamLive}
            setIsStreamLive={setIsStreamLive}
            participants={streamData?.participants ?? []}
            title={streamData?.title ?? ''}
            tags={streamData?.t ?? []}
            viewerCount={streamData?.viewerCount ?? 0}
            // starts={streamData?.createdAt.getTime() ?? 0}
            streamStartedAt={streamStartedAt}
            // ends={ends}
            expiresAt={streamData?.expiresAt?.getTime() ?? 0}
            expired={expired}
          />

          <h2 className="mb-2 text-2xl font-bold">{streamData?.title}</h2>
          <span>d: {streamData?.id}</span>
        </div>

        {/* Notifications */}
        <div className="w-80 overflow-y-auto p-4">
          <h2 className="mb-4 flex items-center text-lg font-semibold">
            <Bell className="mr-2 h-5 w-5" /> Notifications
          </h2>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="mb-4 rounded p-3 shadow">
                <h3 className="font-semibold">Notification {i + 1}</h3>
                <p className="text-sm text-gray-600">This is a sample notification message.</p>
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className="flex h-full w-full sm:w-80 md:shrink-0">
          <NewChat
            channelPubkey={pubkey ?? ''}
            providerPubkey={''}
            streamId={streamData?.id ?? ''}
            channelIdentifier={streamData?.id ?? ''}
            channelProfile={profile}
          />
        </div>
      </>
    )
  }

  // TODO: Fix flashing on refresh
  if (!user) {
    return <div>You must be logged in to view this page</div>
  }

  // TODO: Point user to create a stream if they don't have one
  if (!streamData) {
    return <div>No stream data</div>
  }

  return (
    <div className="flex w-full">
      {/* Sidebar - Always visible */}
      <div className="w-64 overflow-y-auto border-r p-4">
        <h2 className="mb-4 text-lg font-semibold">Menu</h2>
        <ul>
          <li className="mb-2">
            <Button
              variant="ghost"
              className={`w-full justify-start ${currentView === 'dashboard' ? 'bg-accent' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </Button>
          </li>
          <li className="mb-2">
            <Button
              variant="ghost"
              className={`w-full justify-start ${currentView === 'relays' ? 'bg-accent' : ''}`}
              onClick={() => setCurrentView('relays')}
            >
              Relays
            </Button>
          </li>
          <li className="mb-2">
            <Button
              variant="ghost"
              className={`w-full justify-start ${currentView === 'streams' ? 'bg-accent' : ''}`}
              onClick={() => setCurrentView('streams')}
            >
              Streams
            </Button>
          </li>
          <li className="mb-2">
            <Button
              variant="ghost"
              className={`w-full justify-start ${currentView === 'settings' ? 'bg-accent' : ''}`}
              onClick={() => setCurrentView('settings')}
            >
              Settings
            </Button>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex w-full flex-1 overflow-hidden bg-background text-primary">{renderContent()}</div>

      <StreamCreationModal streamId={streamId} isOpen={showModal} setIsOpen={() => setShowModal(false)} />
    </div>
  )
}

Dashboard.getLayout = function (page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>
}

export default Dashboard
