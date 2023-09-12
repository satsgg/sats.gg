import getSettingsLayout from '~/components/Settings/Layout'
import { trpc } from '~/utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { Spinner } from '~/components/Spinner'
import IsLoadingSVG from '~/svgs/is-loading.svg'
import { User } from '@prisma/client'
import CopyValueBar from '~/components/Settings/CopyBar'
import Input from '~/components/Settings/Input'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { toast } from 'react-toastify'

const StreamSettings = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const utils = trpc.useContext()
  const rtmpUrl = 'rtmp://live.sats.gg:5222/app'
  const streamTitleMutation = trpc.user.updateStreamTitle.useMutation()

  const {
    register: registerStreamInfo,
    handleSubmit: handleSubmitStreamInfo,
    formState: { errors: streamInfoErrors },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({
      title: z.string().max(128),
    }),
    defaultValues: {
      title: user.streamTitle || '',
    },
  })

  const onSubmitStreamInfo = async (data: any) => {
    try {
      await streamTitleMutation.mutateAsync({ streamTitle: data.title })
      await utils.invalidate()

      toast.success('Updated stream title!', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    } catch (err: any) {
      console.error(err.message)
      toast.error(err.message, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md mb-2 text-2xl">Stream Key</h2>
      <div className="flex flex-col gap-y-6 rounded border border-gray-500 bg-stone-800 p-6">
        <div className="flex">
          <div className="w-1/4">
            <p>Stream Key</p>
          </div>
          <div className="flex w-3/4 gap-x-4">
            <button className="inline-flex w-32 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white">
              'Refresh Key'
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

      <h2 className="font-md text-2xl">Stream Info</h2>
      <div className="flex flex-col gap-y-6 rounded border border-gray-500 bg-stone-800 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex">
            <div className="flex grow flex-col gap-2">
              <div>
                <p>Stream Title</p>
                <Input
                  name={'title'}
                  placeholder="Sending it live..."
                  error={streamInfoErrors?.title ? true : false}
                  register={registerStreamInfo}
                  rows={1}
                />
                {streamInfoErrors?.title && <p className="italic text-red-600">{streamInfoErrors.title.message}</p>}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              // disabled={!canSign}
              className="align-right inline-flex h-8 w-32 shrink-0 items-center justify-center rounded bg-primary px-2 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-gray-500"
              onClick={handleSubmitStreamInfo(onSubmitStreamInfo)}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StreamSettingsWrapper({}) {
  const [user, setUser, view] = useAuthStore((state) => [state.user, state.setUser, state.view])

  if (view && view !== 'authenticated') {
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
