import { Lsat } from 'lsat-js'
import { useRef, useEffect, memo } from 'react'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import type Video from 'video.js/dist/types/video'
import 'video.js/dist/video-js.css'
import usePlayerStore from '~/store/playerStore'
import TitleOverlay from './TitleOverlay'

// Register VideoJS components
const VjsComponent = videojs.getComponent('Component')
videojs.registerComponent('TitleOverlay', TitleOverlay)

export const VideoJS = ({
  options,
  onReady,
  l402,
}: {
  options: Player['options']
  onReady: Function
  l402: Lsat | null
}) => {
  const videoRef = useRef<Video | null>(null)
  const playerRef = useRef<Player | null>(null)
  const adjustVolume = usePlayerStore((state) => state.adjustVolume)

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    console.debug('videoRef or options change')
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement('video-js')

      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current?.appendChild(videoElement)
      const player = (playerRef.current = videojs(videoElement, options, () => {
        // videojs.log.level('debug')
        // videojs.log('player is ready')
        // let tech = playerRef.current.tech({ IWillNotUseThisInPlugins: true }) as any
        player.on('xhr-hooks-ready', () => {
          // console.debug('xhr hooks ready')
          const playerResponseHook = (request, error, response) => {
            const bar = response.headers.foo
            // console.debug('on response', error, response)
          }
          if (player.tech().vhs) {
            player.tech().vhs.xhr.onResponse(playerResponseHook)
          }
        })
        onReady && onReady(player)
      }))
    }
    // You could update an existing player in the `else` block here
    // on prop change, for example:
    // } else {
    //   const player = playerRef.current
    //   console.debug('vhs else')
    //   player.autoplay(options.autoplay)
    //   player.src(options.sources)
    // }
  }, [JSON.stringify(options), videoRef])

  useEffect(() => {
    if (!playerRef.current || !l402) return
    let tech = playerRef.current.tech({ IWillNotUseThisInPlugins: true }) as any
    const playerRequestHook = (options: { uri: string }) => {
      const l402Uri = new URL(options.uri)

      // let l402Uri = options.uri
      // TODO: Use Authorization header and remove encodeURIComponent
      if (options.uri.match('ts') && l402) {
        l402Uri = `${l402Uri}?l402=${encodeURIComponent(l402.toToken())}`
      }
      options.uri = l402Uri
      return options
    }

    if (tech.vhs) {
      // on second payment, the l402uri is concatenating to expired l402
      // need to refresh this...
      // const playerRequestHook = (options: { uri: string }) => {
      //   const l402Uri = new URL(options.uri)

      //   // let l402Uri = options.uri
      //   if (options.uri.match('ts') && l402) {
      //     l402Uri = `${l402Uri}?l402=${encodeURIComponent(l402.toToken())}`
      //   }
      //   options.uri = l402Uri
      //   return options
      // }
      tech.vhs.xhr.onRequest(playerRequestHook)
    }
    return () => {
      if (!playerRef.current || !l402) return
      let tech = playerRef.current.tech({ IWillNotUseThisInPlugins: true }) as any
      if (tech.vhs) {
        tech.vhs.xhr.offRequest(playerRequestHook)
      }
    }
  }, [playerRef, l402])

  // Save volume in local storage before any refresh
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = () => {
      const player = playerRef.current
      if (player && !player.isDisposed()) {
        const volume = player.volume()
        const muted = player.muted()
        if (!volume) return
        const newVolume = muted === true ? 0 : volume
        adjustVolume(newVolume)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current
    console.debug('player ref change')

    return () => {
      if (player && !player.isDisposed()) {
        console.debug('disposing of player')
        const volume = player.volume()
        const muted = player.muted()
        if (!volume) return
        const newVolume = muted === true ? 0 : volume
        adjustVolume(newVolume)
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return (
    <div data-vjs-player className="h-full">
      {/* <div className="h-full" ref={videoRef} /> */}
      <div className="vjs-matrix vjs-big-play-centered vjs-show-big-play-button-on-pause h-full" ref={videoRef} />
    </div>
  )
}

export default memo(VideoJS)
