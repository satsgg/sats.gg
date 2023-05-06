import { useRouter } from 'next/router'
import { Chat } from '~/components/Chat/Chat'
import ChatSkeleton from '~/components/Chat/ChatSkeleton'
import { nip19 } from 'nostr-tools'
import { Stream } from '~/components/Stream/Stream'
import StreamSkeleton from '~/components/Stream/StreamSkeleton'
import { StreamBio } from '~/components/Stream/StreamBio'
import { Spinner } from '~/components/Spinner'
import { trpc } from '~/utils/trpc'

const getChannelPubkey = (channel: string, isReady: boolean) => {
  if (channel.startsWith('npub1')) {
    try {
      let { type, data: nipData } = nip19.decode(channel)
      if (type === 'npub') {
        return nipData as string
      } else {
        return null
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  // might be hex format
  try {
    // try npub encode to validate hex public key
    nip19.npubEncode(channel)
    return channel
  } catch (error) {
    console.error(error)
    // TODO: Check backend if verified user url i.e. sats.gg/chad
    return null
  }
}

export default function Channel() {
  const { query, isReady } = useRouter()
  if (!isReady) {
    return (
      <div className="flex h-full w-full content-center justify-center">
        <Spinner height={6} width={6} />
      </div>
    )
  }

  const { channel } = query
  if (typeof channel !== 'string') {
    return (
      <div className="flex h-full w-full content-center items-center justify-center">
        <p className="text-white">Invalid query</p>
      </div>
    )
  }

  const channelPubkey = getChannelPubkey(channel, isReady)
  if (!channelPubkey) {
    return (
      <div className="flex h-full w-full content-center items-center justify-center">
        <p className="text-white">Invalid npub or public key</p>
      </div>
    )
  }

  const {
    data: channelUser,
    isLoading: userLoading,
    isError: userError,
  } = trpc.user.getUser.useQuery({ pubkey: channelPubkey }, { refetchInterval: 15000 })

  return (
    <>
      <div
        id="centerColumnWrapper"
        className="no-scrollbar flex w-full shrink-0 flex-col overflow-y-auto sm:h-full sm:shrink"
      >
        <div
          id="streamWrapper"
          className="aspect-video max-h-[calc(100vh-9rem)] sm:border-b sm:border-solid sm:border-gray-500"
        >
          {userLoading ? <StreamSkeleton /> : <Stream channelUser={channelUser} />}
        </div>
        <StreamBio
          channelPubkey={channelPubkey}
          streamTitle={channelUser?.streamTitle}
          streamStatus={channelUser?.streamStatus}
        />
      </div>

      <div className="flex h-full w-full sm:w-80 md:shrink-0">
        {userLoading ? <ChatSkeleton /> : <Chat channelPubkey={channelPubkey} channelUser={channelUser} />}
      </div>
    </>
  )
}
