import { trpc } from '~/utils/trpc'
import { z } from 'zod'
import { useRouter } from 'next/router'
import { Chat } from '~/components/NostrChat/Chat'
import { StreamContainer } from '~/components/Stream/StreamContainer'

export const getUser = z.object({
  userName: z.string().max(24),
})

export default function Channel() {
  const router = useRouter()
  const { channelPubkey } = router.query
  console.log(channelPubkey)

  // if (true) {
  //   return (
  //     <div className="flex grow bg-stone-900">
  //       <p className="text-white">Channel not found</p>
  //     </div>
  //   )
  // }

  return (
    <>
      <StreamContainer channelUser={channelPubkey} />
      <div className="w-max-sm flex h-full w-1/5 min-w-[20%]">
        <Chat channelUser={channelPubkey} />
      </div>
    </>
  )
}
