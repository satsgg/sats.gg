import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { Chat } from '~/components/NostrChat/Chat'
import { nip19 } from 'nostr-tools'
import { Stream } from '~/components/Stream/Stream'
import { StreamBio } from '~/components/Stream/StreamBio'

const isValidQuery = (query: ParsedUrlQuery) => {
  return typeof query.channel === 'string'
}

const getChannelPubkey = (channel: string) => {
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
  console.log('query', query)
  // if (!isReady) return

  // const channel = router.query.channel as string
  console.debug('channel', channel)
  const channelPubkey = getChannelPubkey(channel)

  if (!channelPubkey) {
    return (
      <div className="flex grow bg-stone-900">
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
