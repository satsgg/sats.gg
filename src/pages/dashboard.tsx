import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import useAuthStore from '~/hooks/useAuthStore'
import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
import StreamCreationModal from '~/components/Dashboard/StreamCreationModal'
import Settings from '~/components/Dashboard/Settings'
import { trpc } from '~/utils/trpc'
import { Button } from '~/components/ui/button'
import { useProfile } from '~/hooks/useProfile'
import NewChat from '~/components/Chat/NewChat'
import { createStreamEvent } from '~/utils/nostr'
import { Event as NostrEvent, verifySignature, validateEvent, UnsignedEvent } from 'nostr-tools'
import VideoPlayer from '~/components/Stream/Player'
import DashboardStreamBio from '~/components/Dashboard/DashboardStreamBio'
import Relays from '~/components/Dashboard/Relays'
import Notifications from '~/components/Dashboard/Notifications'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from '~/hooks/useSettingsStore'

interface StreamNotification {
  id: string
  type: 'live_note_published' | 'ended_note_published'
  title: string
  message: string
  read: boolean
  relayResults?: {
    success: number
    total: number
  }
}

export type StreamConfig = {
  pubkey: string
  d: string
  title: string
  summary: string
  image?: string
  t: string[]
  streaming: string
  recording?: string
  starts?: string
  ends?: string
  prevStatus?: 'planned' | 'live' | 'ended'
  status: 'planned' | 'live' | 'ended'
  currentParticipants?: string
  totalParticipants?: string
  p: string[]
  relays: string[]
}

export const DEFAULT_EVENT_CONFIG: StreamConfig = {
  pubkey: '',
  d: '',
  title: '',
  summary: '',
  streaming: '',
  status: 'planned',
  prevStatus: 'planned',
  currentParticipants: '0',
  p: [],
  t: [],
  relays: [],
}

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
  const [notifications, setNotifications] = useState<StreamNotification[]>([])
  const relays = useSettingsStore((state) => state.relays)
  const [streamConfig, setStreamConfig] = useState<StreamConfig>(DEFAULT_EVENT_CONFIG)

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
    if (streamData) {
      const streamingUrl = `https://d1994e6vyyhuyl.cloudfront.net/${streamData.id}/stream.m3u8`
      setStreamConfig((prev) => {
        return {
          ...prev,
          d: streamData.id,
          streaming: streamingUrl,
          p: streamData.participants,
          ends: streamData.expiresAt ? Math.floor(streamData.expiresAt?.getTime() / 1000).toString() : '',
          currentParticipants: '0',
          image: streamData.image ?? '',
          title: streamData.title ?? '',
          summary: streamData.summary ?? '',
          participants: streamData.participants,
          t: streamData.t,
          // relays: streamData.relays,
        }
      })
    }
  }, [streamData])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const publishStreamEvent = async (streamConfig: StreamConfig) => {
    if (!streamConfig?.d) return

    const now = Math.floor(Date.now() / 1000)
    let event: UnsignedEvent = {
      kind: 30311,
      pubkey: pubkey ?? '',
      created_at: now,
      tags: [
        ['d', streamConfig.d],
        ['title', streamConfig.title ?? ''],
        ['summary', streamConfig.summary ?? ''],
        ['streaming', streamConfig.streaming],
        ['image', streamConfig.image ?? ''],
        ['status', streamConfig.status],
        ['current_participants', streamConfig.currentParticipants ?? '0'],
        ['starts', streamConfig.starts ?? ''],
        // ['ends', (Math.floor(streamData.expiresAt?.getTime) ) / 1000).toString()],
        // ['ends', streamData.expiresAt ? Math.floor(streamData.expiresAt?.getTime() / 1000).toString() : ''],
        ['ends', streamConfig.ends ?? ''],
        ['relays', streamConfig.relays.join(',')],
      ],
      content: '',
    }

    for (const participant of streamConfig.p) {
      event.tags.push(['p', participant])
    }

    for (const hashtag of streamConfig.t) {
      event.tags.push(['t', hashtag])
    }

    // console.debug('kind 30311 event', streamConfig.status, event)
    try {
      const signedEvent: NostrEvent | null = await window.nostr.signEvent(event)
      if (!signedEvent) throw new Error('Failed to sign message')
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')
      console.debug('status', streamConfig.status, 'signed event', signedEvent)

      // Publish to relays and track results
      const results = await nostrClient.publish(signedEvent)
      // const successCount = results.filter((result) => result.status === 'fulfilled').length

      // Create a detailed message about relay successes/failures
      // const failedCount = results.length - successCount
      // const message = `Successfully published to ${successCount} ${successCount === 1 ? 'relay' : 'relays'}${
      //   failedCount > 0 ? `, failed on ${failedCount} ${failedCount === 1 ? 'relay' : 'relays'}` : ''
      // }`

      // setNotifications([
      //   ...notifications,
      //   {
      //     id: signedEvent.id,
      //     type: streamConfig.status === 'live' ? 'live_note_published' : 'ended_note_published',
      //     title: streamConfig.status === 'live' ? 'Published live note' : 'Published ended note',
      //     message,
      //     read: false,
      //     relayResults: {
      //       success: successCount,
      //       total: results.length,
      //     },
      //   },
      // ])
    } catch (error) {
      console.error('Error publishing stream event', error)
      // setNotifications([
      //   ...notifications,
      //   {
      //     id: Math.random().toString(),
      //     type: streamConfig.status === 'live' ? 'live_note_published' : 'ended_note_published',
      //     title: 'Failed to publish note',
      //     message: error instanceof Error ? error.message : 'Unknown error occurred',
      //     read: false,
      //   },
      // ])
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

  useEffect(() => {
    if (!streamData?.expiresAt) return
    const expired = currentTime > streamData.expiresAt.getTime()
    setExpired(expired)
  }, [streamData?.expiresAt, currentTime])

  // Set streamStartedAt when going live
  useEffect(() => {
    if (isStreamLive) {
      setStreamStartedAt(Date.now())
    }
  }, [isStreamLive])

  // Update streamConfig when relevant values change
  useEffect(() => {
    setStreamConfig((prev) => ({
      ...prev,
      starts: streamStartedAt ? Math.floor(streamStartedAt / 1000).toString() : prev.starts,
      relays: relays,
      // Ensure we have all required fields from streamData
      d: streamData?.id ?? prev.d,
      streaming: streamData?.id ? `https://d1994e6vyyhuyl.cloudfront.net/${streamData.id}/stream.m3u8` : prev.streaming,
      title: streamData?.title ?? prev.title,
      summary: streamData?.summary ?? prev.summary,
      image: streamData?.image ?? prev.image,
      ends: streamData?.expiresAt ? Math.floor(streamData.expiresAt.getTime() / 1000).toString() : prev.ends,
      p: streamData?.participants ?? prev.p,
      t: streamData?.t ?? prev.t,
    }))
  }, [streamStartedAt, JSON.stringify(relays), JSON.stringify(streamData)])

  // Handle periodic publishing and status changes
  useEffect(() => {
    if (!streamConfig.d || !streamConfig.streaming) return // Don't run if we don't have required data

    let publishInterval: NodeJS.Timeout | null = null

    const publishNote = (status: 'live' | 'ended') => {
      const noteConfig = {
        ...streamConfig,
        status,
        prevStatus: streamConfig.status,
      }
      console.debug('publishing stream note', noteConfig)
      publishStreamEvent(noteConfig)
    }

    if (isStreamLive && !expired) {
      // Publish immediately when going live
      publishNote('live')

      // Set up interval for periodic publishing
      publishInterval = setInterval(() => {
        console.debug('interval publishing stream note')
        publishNote('live')
      }, 30 * 1000)
    } else if ((!isStreamLive || expired) && streamStartedAt > 0) {
      // Stream was live but now stopped or expired - publish final ended status
      publishNote('ended')
    }

    // Update stream state if expired
    if (expired) {
      setIsStreamLive(false)
    }

    return () => {
      if (publishInterval) {
        clearInterval(publishInterval)
      }
    }
  }, [isStreamLive, expired, streamStartedAt, streamConfig.d, streamConfig.streaming])

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
            isStreamLive={isStreamLive}
            setIsStreamLive={setIsStreamLive}
            participants={streamData?.participants ?? []}
            title={streamData?.title ?? ''}
            tags={streamData?.t ?? []}
            viewerCount={streamData?.viewerCount ?? 0}
            streamStartedAt={streamStartedAt}
            expiresAt={streamData?.expiresAt?.getTime() ?? 0}
            expired={expired}
          />
        </div>

        {/* Notifications */}
        {/* <div className="w-80 overflow-y-auto p-4">
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
        </div> */}

        <Notifications notifications={notifications} setNotifications={setNotifications} />

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

  // TODO: Fix flashing on refresh.. validate user and get their credentials on backend..
  // did this on twelvecash by storing the jwt as a cookie
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
