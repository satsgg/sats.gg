import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import useSettingsStore from '../../hooks/useSettingsStore'
import { nostrClient } from '../../nostr/NostrClient'
import { nip19 } from 'nostr-tools'
import { useStream } from '../../hooks/useStream'
import { Spinner } from '../../components/Spinner'
import VideoPlayer from '../../components/Stream/Player'
import { ReactElement } from 'react'

const getChannelInfo = (naddr: string): nip19.AddressPointer | null => {
  try {
    const { type, data } = nip19.decode(naddr)
    if (type === 'naddr') {
      return data as nip19.AddressPointer
    }
  } catch (error) {
    return null
  }
  return null
}

const getEmbedUrl = (router: ReturnType<typeof useRouter>, naddr: string) => {
  const { protocol, host } = window.location
  return `${protocol}//${host}${router.basePath}/embed/${naddr}`
}

export default function EmbedPage() {
  const router = useRouter()
  const { naddr } = router.query

  if (typeof naddr !== 'string') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Invalid query</p>
      </div>
    )
  }

  const channelInfo = getChannelInfo(naddr)
  console.log('channelInfo', channelInfo)
  if (!channelInfo) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Invalid naddr</p>
      </div>
    )
  }

  // TODO: if no relays, use defaults
  useEffect(() => {
    if (!channelInfo.relays) return
    console.debug('connecting to relays', channelInfo.relays)
    nostrClient.connectToRelays(channelInfo.relays)

    const timer = setInterval(() => {
      nostrClient.connect()
    }, 1000 * 60 * 5) // reconnect every 5 minutes

    return () => {
      clearInterval(timer)
    }
  }, [JSON.stringify(channelInfo.relays)])

  const stream = useStream(channelInfo.pubkey, channelInfo.identifier)

  // TODO: Handle stream not found, but after relays are connected
  // const stream = useStream(channelInfo.pubkey, channelInfo.identifier)
  // if (!stream?.streaming) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center">
  //       <p>Stream not found</p>
  //     </div>
  //   )
  // }

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    liveui: false,
    playsinline: true,
    html5: {
      vhs: {
        enableLowInitialPlaylist: true,
        playlistExclusionDuration: 0,
      },
    },
    sources: stream?.streaming
      ? [
          {
            src: stream.streaming,
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
  }

  return (
    <div className="h-screen w-full">
      <VideoPlayer options={videoJsOptions} />
    </div>
  )
}

// Override the default layout to have no wrapper
EmbedPage.getLayout = function getLayout(page: ReactElement) {
  return page
}
