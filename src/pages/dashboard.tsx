import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
import StreamCreationModal from '~/components/StreamCreationModal'
import { trpc } from '~/utils/trpc'

const Dashboard = () => {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [streamId, setStreamId] = useState<string | null>(null)
  const { data, isLoading } = trpc.stream.getCurrentStream.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000,
    enabled: !showModal,
  })

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

  return (
    <div className="flex h-screen w-full">
      {showModal && streamId && <StreamCreationModal streamId={streamId} onClose={() => setShowModal(false)} />}
      {/* Sidebar */}
      <div className="w-64 p-4">
        <nav>
          <ul>
            <li className="mb-2">
              <button className="w-full rounded p-2 text-left hover:bg-gray-200">Stream</button>
            </li>
            <li className="mb-2">
              <button className="w-full rounded p-2 text-left hover:bg-gray-200">Settings</button>
            </li>
            <li className="mb-2">
              <button className="w-full rounded p-2 text-left hover:bg-gray-200">Notifications</button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-4">
        <div className="grid h-full grid-cols-3 gap-4">
          {/* First column: Video preview and Stream info */}
          <div className="flex h-full flex-col">
            <div className="mb-4 flex-1">
              {/* <VideoThumbnail /> */}
              <p>Video Preview</p>
            </div>
            <div className="flex-1">
              {/* <StreamInfoEditor /> */}
              <p>Stream Info</p>
            </div>
          </div>

          {/* Second column: Notifications */}
          <div className="h-full overflow-y-auto">
            {/* <NotificationPanel /> */}
            <p>Notifications</p>
          </div>

          {/* Third column: Chat */}
          <div className="h-full overflow-y-auto">
            {/* <ChatBox /> */}
            <p>Chat</p>
          </div>
        </div>
      </div>
    </div>
  )
}

Dashboard.getLayout = function (page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>
}

export default Dashboard
