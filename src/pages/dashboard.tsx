import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import useAuthStore from '~/hooks/useAuthStore'
import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
// import StreamCreationModal from '~/components/StreamCreationModal'
import StreamCreationModal from '~/components/Dashboard/StreamCreationModal'
import { trpc } from '~/utils/trpc'
import { Button } from '~/components/ui/button'
import { ChevronUp, ChevronDown, Bell, MessageSquare } from 'lucide-react'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useStream } from '~/hooks/useStream'
import { useProfile } from '~/hooks/useProfile'
import NewChat from '~/components/Chat/NewChat'
import { createStreamEvent } from '~/utils/nostr'
import { nostrClient } from '~/nostr/NostrClient'
import { Event as NostrEvent, verifySignature, validateEvent } from 'nostr-tools'

const Dashboard = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [streamId, setStreamId] = useState<string>('')

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
      nostrClient.publish(signedEvent)
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
  console.debug('streamData', streamData)

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

  if (!user) {
    return <div>You must be logged in to view this page</div>
  }

  if (!streamData) {
    return <div>No stream data</div>
  }

  return (
    <div className="flex w-full">
      {/* Main content */}
      {/* <div className="grid h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4"> */}
      <div className="flex flex-1 overflow-hidden bg-background text-primary">
        {/* Sidebar */}
        {true && (
          <div className="w-64 overflow-y-auto p-4">
            <h2 className="mb-4 text-lg font-semibold">Menu</h2>
            <ul>
              <li className="mb-2">
                <a href="#" className="hover:underline">
                  Dashboard
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:underline">
                  Relays
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:underline">
                  Streams
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className=" hover:underline">
                  Settings
                </a>
              </li>
            </ul>
          </div>
        )}

        {/* Video and Stream Info */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* <div className="aspect-w-16 aspect-h-9 mb-4 bg-gray-300"> */}
          <div className="mb-4 aspect-video bg-gray-300">
            {/* Placeholder for video player */}
            <div className="flex h-full items-center justify-center text-gray-500">Thumbnail</div>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Stream Title</h2>
          <Button variant="outline" onClick={() => publishStreamEvent('live')}>
            Publish Live
          </Button>
          <Button variant="outline" onClick={() => publishStreamEvent('ended')}>
            Publish Ended
          </Button>
          <span>d: {streamData.id}</span>
          {/* <p className={`text-gray-600 ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </p>
          <Button variant="ghost" onClick={toggleDescription} className="mt-2">
            {isDescriptionExpanded ? (
              <>
                Show Less <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Show More <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button> */}
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
            streamId={streamData?.id}
            channelIdentifier={streamData?.id}
            channelProfile={profile}
          />
        </div>
      </div>

      <StreamCreationModal streamId={streamId} isOpen={showModal} setIsOpen={() => setShowModal(false)} />
    </div>
  )
}

Dashboard.getLayout = function (page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>
}

export default Dashboard
