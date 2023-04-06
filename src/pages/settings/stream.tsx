import getSettingsLayout from '~/components/Settings/Layout'
import { trpc } from '~/utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { Spinner } from '~/components/Spinner'
import IsLoadingSVG from '~/svgs/is-loading.svg'
import { User } from '@prisma/client'
import CopyValueBar from '~/components/Settings/CopyBar'

const StreamSettings = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const refreshStreamKeyMutation = trpc.user.refreshStreamKey.useMutation()
  const utils = trpc.useContext()
  const rtmpUrl = 'rtmp://global-live.mux.com:5222/app'

  const onSubmitRefreshStreamKey = async () => {
    setUser(await refreshStreamKeyMutation.mutateAsync())
    await utils.invalidate()
  }

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md mb-2 text-2xl">Stream</h2>
      <div className="flex flex-col gap-y-6 rounded border border-gray-500 bg-stone-800 p-6">
        <div className="flex">
          <div className="w-1/4">
            <p>Stream Key</p>
          </div>
          <div className="flex w-3/4 gap-x-4">
            <CopyValueBar value={user.streamKey} />

            <button
              className="inline-flex w-32 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white"
              disabled={refreshStreamKeyMutation.isLoading}
              onClick={onSubmitRefreshStreamKey}
            >
              {refreshStreamKeyMutation.isLoading ? (
                <IsLoadingSVG width={24} height={24} className="animate-spin" strokeWidth={2} />
              ) : (
                'Refresh Key'
              )}
            </button>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/4">
            <p>RTMP URL</p>
          </div>
          <div className="flex w-3/4">
            <CopyValueBar value={rtmpUrl} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StreamSettingsWrapper({}) {
  const { user, setUser, status: authStatus } = useAuthStore()

  if (authStatus === 'unauthenticated') {
    return <p>You must be logged in to view this page</p>
  }

  if (user) {
    return <StreamSettings user={user} setUser={setUser} />
  }

  return (
    <div className={'w-full text-center'}>
      <Spinner />
    </div>
  )
}

StreamSettingsWrapper.getLayout = getSettingsLayout
