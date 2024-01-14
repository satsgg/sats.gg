import { useRouter } from 'next/router'
import { Chat } from '~/components/Chat/Chat'
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

  const channelPubkey = typeof channelInfo === 'string' ? channelInfo : channelInfo.pubkey

  const { profile: channelProfile, isLoading: channelProfileIsLoading } = useProfile(channelPubkey)
  console.log('channelProfile', channelProfile)

  const stream = useStream(channelPubkey)

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
          {stream?.streaming ? <VideoPlayer url={stream.streaming} /> : <StreamSkeleton />}

          {zapInvoice && showZapModule && (
            <div className="absolute right-0 bottom-0 z-[101] flex max-h-full w-80 max-w-[66%] shrink overflow-y-scroll">
              <ZapInvoiceModule invoice={zapInvoice} type="stream" close={closeZap} />
            </div>
          )}
        </div>
        <StreamBio
          channelPubkey={channelPubkey}
          channelProfile={channelProfile}
          channelProfileIsLoading={channelProfileIsLoading}
          streamTitle={stream?.title}
          streamStatus={stream?.status}
          participants={stream?.p}
          viewerCount={stream?.currentParticipants}
          zapInvoice={zapInvoice}
          setZapInvoice={setZapInvoice}
          setShowZapModule={setShowZapModule}
        />
      </div>

      {/* TODO: Better useLoading && !channelUser skeleton handling */}
      <div className="flex h-full w-full sm:w-80 md:shrink-0">
        {stream?.d ? (
          <Chat
            channelPubkey={channelPubkey}
            streamId={stream.id}
            channelIdentifier={stream.d}
            channelProfile={channelProfile}
          />
        ) : (
          <ChatSkeleton />
        )}
      </div>
    </>
  )
}
