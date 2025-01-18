import { useRouter } from 'next/router'
import { Chat } from '~/components/Chat/Chat'
import NewChat from '~/components/Chat/NewChat'
import ChatSkeleton from '~/components/Chat/ChatSkeleton'
import { nip19 } from 'nostr-tools'
import StreamSkeleton from '~/components/Stream/StreamSkeleton'
import { StreamBio } from '~/components/Stream/StreamBio'
import { Spinner } from '~/components/Spinner'
import { useProfile } from '~/hooks/useProfile'
import { useEffect, useState } from 'react'
import ZapInvoiceModule from '~/components/ZapInvoiceModule'
import useMediaQuery from '~/hooks/useMediaQuery'
import VideoPlayer from '~/components/Stream/Player'
import { useStream } from '~/hooks/useStream'

const getChannelPubkey = (channel: string, isReady: boolean): nip19.AddressPointer | string | null => {
  if (channel.startsWith('naddr')) {
    try {
      const { type, data } = nip19.decode(channel)
      if (type === 'naddr') {
        return data as nip19.AddressPointer
      }
    } catch (error) {
      return null
    }
  }
  if (channel === 'chad') {
    return 'e9038e10916d910869db66f3c9a1f41535967308b47ce3136c98f1a6a22a6150'
  }
  if (channel === 'satbox') {
    return '8756779be69455fee07957ae409a7485914b06a747ff0b105721dcf1538697e1'
  }
  if (channel === 'pokemon') {
    // return '0bed926df26089c6869621abf8b27858dd0b61f2c3c556e84fd9c08f0f499344'
    return 'e9038e10916d910869db66f3c9a1f41535967308b47ce3136c98f1a6a22a6150'
  }

  if (channel.startsWith('npub1')) {
    try {
      let { type, data: nipData } = nip19.decode(channel)
      if (type === 'npub') {
        return nipData as string
      } else {
        return null
      }
    } catch (error) {
      return null
    }
  }

  // might be hex format
  try {
    // try npub encode to validate hex public key
    let npub = nip19.npubEncode(channel)
    let { type, data: nipData } = nip19.decode(npub)
    if (type === 'npub') {
      return nipData as string
    }
  } catch (error) {
    return null
  }

  return null
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

  const channelInfo = getChannelPubkey(channel, isReady)
  if (!channelInfo) {
    return (
      <div className="flex h-full w-full content-center items-center justify-center">
        <p className="text-white">Invalid naddr/npub/pubkey</p>
      </div>
    )
  }

  let channelPubkey = typeof channelInfo === 'string' ? channelInfo : channelInfo.pubkey
  const channelIdentifier = typeof channelInfo === 'string' ? undefined : channelInfo.identifier

  const stream = useStream(channelPubkey, channelIdentifier)
  channelPubkey = stream?.pubkey || channelPubkey

  const { profile: channelProfile, isLoading: channelProfileIsLoading } = useProfile(channelPubkey)
  console.log('channelProfile', channelProfile)
  // console.log('parsed stream', stream)

  const [zapInvoice, setZapInvoice] = useState<string | null>(null)
  const [showZapModule, setShowZapModule] = useState(false)

  // True when < 640px (tailwind sm)
  const resetZapInfo = !useMediaQuery('(min-width: 640px)')
  const closeZap = () => {
    setZapInvoice(null)
    setShowZapModule(false)
  }
  useEffect(() => {
    if (resetZapInfo) {
      closeZap()
    }
  }, [resetZapInfo])

  useEffect(() => {
    return () => {
      closeZap()
    }
  }, [channel])

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    liveui: false,
    // inactivityTimeout: 100,
    playsinline: true,
    poster: stream?.image || undefined,
    html5: {
      vhs: {
        enableLowInitialPlaylist: true,
        // prevent playlist from being excluded when we get a errors on it (402...)
        // need it to be smarter. Actual broken playlists won't get excluded now
        playlistExclusionDuration: 0,
        // allowSeeksWithinUnsafeLiveWindow: true,
      },
    },
    sources: stream?.streaming
      ? [
          {
            // src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
            src: stream?.streaming,
            type: 'application/x-mpegURL',
            customTagParsers: [
              {
                expression: /#EXT-X-PRICE:(\d+)/,
                customType: 'price',
                dataParser: (line: string) => {
                  const match = /#EXT-X-PRICE:(\d+)/.exec(line)
                  return match && match[1] ? parseInt(match[1], 10) : null
                },
                segment: true,
              },
            ],
          },
        ]
      : [],
    plugins: {
      // httpSourceSelector: {
      //   default: 'auto',
      // },
    },
  }

  return (
    <>
      <div
        id="centerColumnWrapper"
        className="no-scrollbar flex w-full shrink-0 flex-col overflow-y-auto sm:h-full sm:shrink"
      >
        <div
          id="streamWrapper"
          className="relative aspect-video max-h-[calc(100vh-9rem)] sm:border-b sm:border-solid sm:border-gray-500"
        >
          <VideoPlayer options={videoJsOptions} />

          {zapInvoice && showZapModule && (
            <div className="absolute right-0 bottom-0 z-[101] flex max-h-full w-80 max-w-[66%] shrink overflow-y-scroll">
              <ZapInvoiceModule invoice={zapInvoice} type="stream" close={closeZap} />
            </div>
          )}
        </div>
        <StreamBio
          channelPubkey={channelPubkey}
          providerPubkey={stream?.providerPubkey}
          streamStreaming={stream?.streaming}
          streamIdentifier={stream?.d}
          channelProfile={channelProfile}
          channelProfileIsLoading={channelProfileIsLoading}
          streamTitle={stream?.title}
          streamStatus={stream?.status}
          participants={stream?.p}
          tags={stream?.t}
          viewerCount={stream?.currentParticipants}
          starts={stream?.starts}
          ends={stream?.ends}
          relays={stream?.relays}
          zapInvoice={zapInvoice}
          setZapInvoice={setZapInvoice}
          setShowZapModule={setShowZapModule}
        />
      </div>

      <div className="flex h-full w-full sm:w-80 md:shrink-0">
        {stream && (
          <NewChat
            channelPubkey={channelPubkey}
            providerPubkey={stream.providerPubkey}
            streamId={stream.id}
            channelIdentifier={stream.d}
            channelProfile={channelProfile}
          />
        )}
      </div>
    </>
  )
}
