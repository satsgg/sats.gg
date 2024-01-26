import { useRef, memo } from 'react'
import usePlayerStore from '~/store/playerStore'

// This imports the functional component from the previous sample.
import VideoJS from './VideoJS'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'

const VideoPlayer = ({ url }: { url: string }) => {
  const playerRef = useRef<Player | null>(null)
  const volume = usePlayerStore((state) => state.volume)

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    liveui: true,
    playsinline: true,
    sources: [
      {
        // src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
        src: url ?? '',
        type: 'application/x-mpegURL',
      },
    ],
  }

  // console.debug('player rendered', url)
  // console.debug('volume', volume)

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player

    // You can handle player events here, for example:
    player.on('waiting', () => {
      videojs.log('player is waiting')
    })

    player.on('dispose', () => {
      videojs.log('player will dispose')
    })
    // player.on('volumechange', () => {
    //   console.debug('volume change', player.volume())
    // })

    player.volume(volume)
  }

  return <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
}

export default memo(VideoPlayer)
