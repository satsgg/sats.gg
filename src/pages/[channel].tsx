import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { Chat } from '~/components/NostrChat/Chat'
import { nip19 } from 'nostr-tools'
import { Stream } from '~/components/Stream/Stream'
import { StreamBio } from '~/components/Stream/StreamBio'
import { Spinner } from '~/components/Spinner'

const isValidQuery = (query: ParsedUrlQuery) => {
  return typeof query.channel === 'string'
}

const getChannelPubkey = (channel: string, isReady: boolean) => {
  if (!isReady) return null
  if (typeof channel !== 'string') return null
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

export default function Channel({ playbackId, sourceWidth, sourceHeight, blurHashBase64 }) {
  // const router = useRouter()
  const { query, isReady } = useRouter()

  // if (!isValidQuery(router.query)) {
  //   return (
  //     <div className="flex grow bg-stone-900">
  //       <p className="text-white">Invalid query</p>
  //     </div>
  //   )
  // }
  const { channel } = query
  // if (!isReady) return

  // const channel = router.query.channel as string
  const channelPubkey = getChannelPubkey(channel, isReady)

  // loading -> found
  // loading -> error
  // assume it's the right key... display skeleton channel always before invalid
  if (!isReady) {
    return (
      <div className="flex h-full w-full content-center justify-center">
        <Spinner height={6} width={6} />
      </div>
    )
  }

  if (!channelPubkey) {
    return (
      <div className="flex h-full w-full content-center items-center justify-center">
        <p className="text-white">Invalid public key</p>
      </div>
    )
  }

  return (
    <>
      <div
        id="centerColumnWrapper"
        className="no-scrollbar flex w-full shrink-0 flex-col overflow-y-auto sm:h-screen sm:shrink"
      >
        <div
          id="streamWrapper"
          className="no-scrollbar flex aspect-video max-h-[calc(100vh-9rem)] flex-col sm:border-b sm:border-solid sm:border-gray-500"
        >
          <Stream channelPubkey={channelPubkey} />
        </div>
        <StreamBio channelPubkey={channelPubkey} />
      </div>

      <div className="flex h-full w-full sm:w-80 md:shrink-0">
        <Chat channelPubkey={channelPubkey} />
      </div>
    </>
  )
}
