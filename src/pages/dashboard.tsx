import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import StreamCreationModal from '~/components/StreamCreationModal'

const Dashboard = () => {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [streamId, setStreamId] = useState<string | null>(null)

  console.debug('router', router)
  useEffect(() => {
    console.debug('router.querya', router.query)
    if (router.isReady) {
      console.debug('router.query', router.query)
      const { streamId } = router.query
      if (streamId) {
        console.log('streamId', streamId)
        setShowModal(true)
        setStreamId(streamId as string)
        // Remove the query parameters from the URL without triggering a navigation
        router.replace('/dashboard', undefined, { shallow: true })
      }
    }
  }, [router.isReady, router.query])

  return (
    <div>
      {/* Your dashboard content */}
      {showModal && streamId && <StreamCreationModal streamId={streamId} onClose={() => setShowModal(false)} />}
      <p>hi</p>
    </div>
  )
}

export default Dashboard
