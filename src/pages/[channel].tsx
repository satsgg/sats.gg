import { trpc } from '~/utils/trpc'
import { z } from 'zod'
import { useRouter } from 'next/router'
import { Chat } from '~/components/NostrChat/Chat'
import { StreamContainer } from '~/components/Stream/StreamContainer'
import { NostrProvider } from '~/context/nostr'

export const getUser = z.object({
  userName: z.string().max(24),
})

const relayUrls = [
  'wss://brb.io',
  'wss://relay.damus.io',
  // "wss://nostr-relay.wlvs.space",
  // "wss://nostr.fmt.wiz.biz",
  // "wss://nostr.oxtr.dev",
  'wss://arc1.arcadelabs.co',
  'wss://relay.nostr.ch',
]

export default function Channel() {
  const router = useRouter()
  const { channel } = router.query
  const {
    data: channelUser,
    isLoading: userLoading,
    isError: userError,
  } = trpc.user.getUser.useQuery({ userName: channel }, { refetchInterval: 15000 })

  if (userLoading) {
    return <div className="flex grow bg-stone-900"></div>
  }

  if (!userLoading && !channelUser) {
    return (
      <div className="flex grow bg-stone-900">
        <p className="text-white">Channel not found</p>
      </div>
    )
  }

  return (
    <NostrProvider relayUrls={relayUrls} debug={true}>
      <StreamContainer channelUser={channelUser} />
      <div className="w-max-sm flex h-full w-1/5 min-w-[20%]">
        <Chat channelUser={channelUser} />
      </div>
    </NostrProvider>
  )
}
