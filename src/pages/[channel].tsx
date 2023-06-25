import { useRouter } from 'next/router'
import { Chat } from '~/components/Chat/Chat'
import ChatSkeleton from '~/components/Chat/ChatSkeleton'
import { nip19 } from 'nostr-tools'
import { Stream } from '~/components/Stream/Stream'
import StreamSkeleton from '~/components/Stream/StreamSkeleton'
import { StreamBio } from '~/components/Stream/StreamBio'
import { Spinner } from '~/components/Spinner'
import { trpc } from '~/utils/trpc'
import { useProfile } from '~/hooks/useProfile'
import { useEffect, useState } from 'react'
import ZapInvoiceModule from '~/components/ZapInvoiceModule'
import useMediaQuery from '~/hooks/useMediaQuery'

const getChannelPubkey = (channel: string, isReady: boolean) => {
  if (channel === 'chad') {
    return 'e9038e10916d910869db66f3c9a1f41535967308b47ce3136c98f1a6a22a6150'
  }
  if (channel === 'satbox') {
    return '8756779be69455fee07957ae409a7485914b06a747ff0b105721dcf1538697e1'
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

  const { profile: channelProfile, isLoading: channelProfileIsLoading } = useProfile(channelPubkey)

  const {
    data: channelUser,
    isLoading: userLoading,
    isError: userError,
  } = trpc.user.getUser.useQuery({ pubkey: channelPubkey }, { refetchInterval: 15000 })

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
          {userLoading ? <StreamSkeleton /> : <Stream channelUser={channelUser} />}
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
          streamTitle={channelUser?.streamTitle}
          streamStatus={channelUser?.streamStatus}
          zapInvoice={zapInvoice}
          setZapInvoice={setZapInvoice}
          setShowZapModule={setShowZapModule}
        />
      </div>

      <div className="flex h-full w-full sm:w-80 md:shrink-0">
        {userLoading ? (
          <ChatSkeleton />
        ) : (
          <Chat channelPubkey={channelPubkey} channelProfile={channelProfile} channelUser={channelUser} />
        )}
      </div>
    </>
  )
}
