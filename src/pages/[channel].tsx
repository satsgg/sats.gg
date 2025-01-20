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
import Head from 'next/head'
import { getStreamNaddr } from '~/utils/nostr'
import { GetServerSideProps } from 'next'
import { nostrClient } from '~/nostr/NostrClient'
import type { Event } from 'nostr-tools'
import { DEFAULT_RELAYS } from '~/store/settingsStore'

// Add WebSocket polyfill for server-side
if (typeof window === 'undefined') {
  const WebSocket = require('ws')
  ;(global as any).WebSocket = WebSocket
}

interface StreamData {
  title?: string
  summary?: string
  image?: string
  d?: string
  relays?: string[]
  streaming?: string
}

interface ChannelProps {
  naddr: string
  addressPointer: nip19.AddressPointer
  initialStreamData?: StreamData
}

const parseAddressPointer = (channel: string): nip19.AddressPointer | null => {
  try {
    const { type, data } = nip19.decode(channel)
    if (type === 'naddr') {
      return data as nip19.AddressPointer
    }
    return null
  } catch (error) {
    return null
  }
}

const getChannelPubkey = (channel: string, isReady: boolean): nip19.AddressPointer | string | null => {
  // NOTE: for now, just assume naddr link
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

export const getServerSideProps: GetServerSideProps<ChannelProps> = async ({ query }) => {
  const { channel } = query
  console.debug('SSR: query', query)
  if (typeof channel !== 'string') {
    return { notFound: true }
  }

  // channel can be pubkey, npub, or naddr
  // need to create an naddr regardless...

  // const channelInfo = getChannelPubkey(channel, true)
  const addressPointer = parseAddressPointer(channel)
  if (!addressPointer) {
    return { notFound: true }
  }

  // const channelPubkey = typeof channelInfo === 'string' ? channelInfo : channelInfo.pubkey
  // const channelIdentifier = typeof channelInfo === 'string' ? undefined : channelInfo.identifier

  try {
    // await nostrClient.connect()
    nostrClient.connectToRelays(addressPointer.relays || DEFAULT_RELAYS)

    // Wait for stream data with a timeout
    const streamData = await new Promise<Event | null>((resolve) => {
      const timeout = setTimeout(() => {
        nostrClient.unsubscribe('server-stream')
        resolve(null)
      }, 3000)

      nostrClient.subscribe(
        'server-stream',
        [
          {
            kinds: [30311],
            authors: [addressPointer.pubkey],
            '#d': addressPointer.identifier ? [addressPointer.identifier] : undefined,
          },
        ],
        (event: Event) => {
          clearTimeout(timeout)
          nostrClient.unsubscribe('server-stream')
          resolve(event)
        },
      )
    })

    nostrClient.disconnectFromRelays(addressPointer.relays || DEFAULT_RELAYS)

    console.debug('streamData', streamData)
    if (!streamData) {
      return {
        props: {
          naddr: channel,
          addressPointer,
        },
      }
    }

    // Parse stream data
    console.debug('streamData2', streamData)
    const parsedStream: StreamData = {
      title: streamData.tags.find((t) => t[0] === 'title')?.[1],
      summary: streamData.tags.find((t) => t[0] === 'summary')?.[1],
      image: streamData.tags.find((t) => t[0] === 'image')?.[1],
      d: streamData.tags.find((t) => t[0] === 'd')?.[1],
      relays: streamData.tags
        .filter((t) => t[0] === 'relay')
        .map((t) => t[1])
        .filter((relay): relay is string => typeof relay === 'string'),
      streaming: streamData.tags.find((t) => t[0] === 'streaming')?.[1],
    }

    return {
      props: {
        naddr: channel,
        addressPointer,
        initialStreamData: parsedStream,
      },
    }
  } catch (error) {
    console.error('Error fetching stream data:', error)
    return {
      props: {
        naddr: channel,
        addressPointer,
      },
    }
  }
}

export default function Channel({ naddr, addressPointer, initialStreamData }: ChannelProps) {
  const { query, isReady } = useRouter()
  const origin =
    typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://sats.gg'

  if (!isReady) {
    return (
      <div className="flex h-full w-full content-center justify-center">
        <Spinner height={6} width={6} />
      </div>
    )
  }
  console.debug('Channel: addressPointer', addressPointer)
  useEffect(() => {
    console.debug('Channel: initialStreamData', initialStreamData)
  }, [initialStreamData])

  const stream = useStream(addressPointer.pubkey, addressPointer.identifier)
  const { profile: channelProfile, isLoading: channelProfileIsLoading } = useProfile(
    stream?.pubkey || addressPointer.pubkey,
  )

  // Use initialStreamData for meta tags if available, otherwise fall back to client-side stream data
  const metaData = stream || initialStreamData

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
  }, [stream?.pubkey])

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    liveui: false,
    // inactivityTimeout: 100,
    playsinline: true,
    poster: metaData?.image || undefined,
    preload: 'none',
    html5: {
      vhs: {
        enableLowInitialPlaylist: true,
        // prevent playlist from being excluded when we get a errors on it (402...)
        // need it to be smarter. Actual broken playlists won't get excluded now
        playlistExclusionDuration: 0,
        // allowSeeksWithinUnsafeLiveWindow: true,
      },
    },
    sources: metaData?.streaming
      ? [
          {
            src: metaData.streaming,
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
      <Head>
        <meta name="twitter:card" content="player" />
        <meta name="twitter:site" content="@satsgg" />
        <meta name="twitter:title" content={metaData?.title || 'Live Stream'} />
        <meta name="twitter:description" content={metaData?.summary?.slice(0, 200) || 'Watch live on sats.gg'} />
        <meta name="twitter:image" content={metaData?.image || ''} />
        {/* {metaData?.d && ( */}
        <meta
          name="twitter:player"
          // content={`${origin}/embed/${getStreamNaddr(initialChannelPubkey, metaData.d, metaData?.relays)}`}
          content={`${origin}/embed/${naddr}`}
        />
        {/* )} */}
        <meta name="twitter:player:width" content="640" />
        <meta name="twitter:player:height" content="480" />
      </Head>
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
          channelPubkey={stream?.pubkey || addressPointer.pubkey}
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
            channelPubkey={addressPointer.pubkey}
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
