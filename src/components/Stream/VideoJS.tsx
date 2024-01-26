import { useRef, useEffect } from 'react'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import type Video from 'video.js/dist/types/video'
import PlayerOptions from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'
import usePlayerStore from '~/store/playerStore'

// export const VideoJS = (props) => {
export const VideoJS = ({ options, onReady }: { options: any; onReady: Function }) => {
  const videoRef = useRef<Video | null>(null)
  const playerRef = useRef<Player | null>(null)
  const adjustVolume = usePlayerStore((state) => state.adjustVolume)

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement('video-js')

      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current?.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready')
        onReady && onReady(player)
      }))

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current

      player.autoplay(options.autoplay)
      player.src(options.sources)
    }
  }, [options, videoRef])

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

    return () => {
      if (player && !player.isDisposed()) {
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
      <div className="h-full" ref={videoRef} />
    </div>
  )
}

export default VideoJS
