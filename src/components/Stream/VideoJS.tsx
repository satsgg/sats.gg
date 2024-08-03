import { Lsat } from 'lsat-js'
import { useRef, useEffect, memo } from 'react'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import type Video from 'video.js/dist/types/video'
// import PlayerOptions from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'
import usePlayerStore from '~/store/playerStore'
// require('videojs-hls-quality-selector')
// import hlsQualitySelector from 'videojs-hls-quality-selector'
// videojs.registerPlugin('hlsQualitySelector', hlsQualitySelector)

// export const VideoJS = (props) => {
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
        videojs.log('player is ready')
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
  }, [options, videoRef])

  useEffect(() => {
    // console.debug('effect l402')
    // console.debug('effect videoRef.current', videoRef.current)
    // console.debug('effect playerRef.current', playerRef.current)
    if (!playerRef.current || !l402) return
    let tech = playerRef.current.tech({ IWillNotUseThisInPlugins: true }) as any
    if (tech.vhs) {
      // // console.debug('effect in tech vhs')
      tech.vhs.xhr.beforeRequest = (o: { uri: string }) => {
        //   console.debug('effect in onRequest')
        if (o.uri.match('ts') && l402) {
          o.uri = `${o.uri}?l402=${encodeURIComponent(l402.toToken())}`
        }
        return o
      }
    }
    // somehow update the beforeRequest
  }, [playerRef, l402])

  // Save volume in local storage before any refresh
  window.addEventListener('beforeunload', (event) => {
    const player = playerRef.current
    if (player && !player.isDisposed()) {
      const volume = player.volume()
      const muted = player.muted()
      if (!volume) return
      const newVolume = muted === true ? 0 : volume
      adjustVolume(newVolume)
    }
  })

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
