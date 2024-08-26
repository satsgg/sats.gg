import { StreamStatus } from '@prisma/client'
import { InteractionModal } from './InteractionModal'
import { trpc } from '~/utils/trpc'
import { Spinner } from './Spinner'
import CopyValueBar from './Settings/CopyBar'
import { useEffect, useState } from 'react'

const StreamCreationModal = ({ streamId, onClose }: { streamId: string; onClose: () => void }) => {
  const [streamReady, setStreamReady] = useState(false)
  const { data, isLoading } = trpc.stream.getStreamById.useQuery(streamId, {
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 1000,
    enabled: !!streamReady,
  })

  useEffect(() => {
    if (data?.status === StreamStatus.READY) {
      setStreamReady(true)
      onClose()
    }
  }, [data?.status])
  return (
    <InteractionModal title="Creating stream" close={onClose}>
      <p>{data?.status}</p>
      {data?.status === StreamStatus.PROVISIONING && (
        <div className="flex flex-col gap-4">
          <h2>Creating stream</h2>
          <Spinner />
        </div>
      )}
      {/* TODO: PROVISIONING FAILED */}
      {data?.status === StreamStatus.READY && (
        <div>
          <p>Stream ready</p>
          <label>RTMP URL</label>
          <CopyValueBar value={data.rtmpUrl!} />
          <label>Stream Key</label>
          <CopyValueBar value={data.streamKey} />
          <p>Live event notes are signed by you and published under on the dashboard page</p>
          <p>Please keep the dasboard open while streaming!</p>
          <p>{'Have fun =]'}</p>
        </div>
      )}
    </InteractionModal>
  )
}

export default StreamCreationModal
