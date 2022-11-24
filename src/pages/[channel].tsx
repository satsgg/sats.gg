import { trpc } from '~/utils/trpc'
import { z } from 'zod'
import { useRouter } from 'next/router'
import { Chat } from '~/components/Chat/Chat'
import { StreamContainer } from '~/components/Stream/StreamContainer'

export const getUser = z.object({
  userName: z.string().max(24),
})

export default function Channel() {
  const router = useRouter()
  const { channel } = router.query
  const {
    data: channelUser,
    isLoading: userLoading,
    isError: userError,
  } = trpc.user.getUser.useQuery({ userName: channel }, { refetchInterval: 15000 })

  if (userLoading) {
    return <div className="flex grow bg-stone-900">{/* <p className="text-white">LOADING</p> */}</div>
  }

  if (!userLoading && !channelUser) {
    return (
      <div className="flex grow bg-stone-900">
        <p className="text-white">Channel not found</p>
      </div>
    )
  }

  return (
    <div className="flex grow bg-stone-900">
      <div className="flex h-full grow">
        <StreamContainer channelUser={channelUser} />
      </div>
      <div className="w-max-sm flex h-full w-1/5 flex-shrink-0">
        <Chat channelUser={channelUser} />
      </div>
    </div>
  )
}
