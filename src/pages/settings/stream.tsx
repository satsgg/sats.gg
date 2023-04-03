import { useState } from 'react'
import { trpc } from '~/utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { Spinner } from '~/components/Spinner'
import IsLoadingSVG from '~/svgs/is-loading.svg'
import CheckmarkSVG from '~/svgs/checkmark.svg'
import ClipboardSVG from '~/svgs/clipboard.svg'
import { User } from '@prisma/client'

const ProfileSettings = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const [showCopied, setShowCopied] = useState(false)
  const [showCopiedURL, setShowCopiedURL] = useState(false)

  const refreshStreamKeyMutation = trpc.user.refreshStreamKey.useMutation()
  const utils = trpc.useContext()
  const rtmpUrl = 'rtmp://global-live.mux.com:5222/app'

  const handleStreamKeyClick = async () => {
    await navigator.clipboard.writeText(user.streamKey)
    setShowCopied(true)
    setTimeout(() => {
      setShowCopied(false)
    }, 2000)
  }

  const handleURLClick = async () => {
    await navigator.clipboard.writeText(rtmpUrl)
    setShowCopiedURL(true)
    setTimeout(() => {
      setShowCopiedURL(false)
    }, 2000)
  }

  const onSubmitRefreshStreamKey = async () => {
    setUser(await refreshStreamKeyMutation.mutateAsync())
    await utils.invalidate()
  }

  return (
    <div className="w-full bg-stone-900 py-10 px-8 text-white">
      <h1 className="mb-6 border-b border-gray-500 pb-4 text-4xl font-bold">Settings</h1>
      <div className="flex w-3/5 flex-col gap-8">
        <div>
          <h2 className="font-md mb-2 text-xl">Stream Settings</h2>
          <div className="flex flex-col gap-y-6 rounded border border-gray-500 bg-stone-800 p-6">
            <div className="flex">
              <div className="w-1/4">
                <p>Stream Key</p>
              </div>
              <div className="flex w-3/4 gap-x-4">
                <div className="flex w-full">
                  <input
                    type="button"
                    className="w-full min-w-0 rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary focus:bg-slate-900"
                    onClick={handleStreamKeyClick}
                    value={user.streamKey}
                  />
                  <button
                    className="rounded-r border-2 border-gray-500 bg-primary p-2 text-white"
                    onClick={handleStreamKeyClick}
                  >
                    {showCopied ? (
                      <CheckmarkSVG width={24} height={24} strokeWidth={1.5} />
                    ) : (
                      <ClipboardSVG width={24} height={24} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
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
                <input
                  type="button"
                  className="w-full min-w-0 rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary focus:bg-slate-900"
                  onClick={handleURLClick}
                  value={rtmpUrl}
                />
                <button
                  className="rounded-r border-2 border-gray-500 bg-primary p-2 text-white"
                  onClick={handleURLClick}
                >
                  {showCopiedURL ? (
                    <CheckmarkSVG width={24} height={24} strokeWidth={1.5} />
                  ) : (
                    <ClipboardSVG width={24} height={24} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfileSettingsWrapper({}) {
  const { user, setUser, status: authStatus } = useAuthStore()

  if (authStatus === 'unauthenticated') {
    return <p>You must be logged in to view this page</p>
  }

  if (user) {
    return <ProfileSettings user={user} setUser={setUser} />
  }

  return (
    <div className={'w-full text-center'}>
      <Spinner />
    </div>
  )
}
