import { useRef, memo } from 'react'

// This imports the functional component from the previous sample.
import VideoJS from './VideoJS'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'

const VideoPlayer = ({ url }: { url: string }) => {
  const playerRef = useRef<Player | null>(null)

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    liveui: true,
    sources: [
      {
        // src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
        src: url ?? '',
        type: 'application/x-mpegURL',
      },
    ],
  }

  console.debug('player rendered', url)

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player

    // You can handle player events here, for example:
    player.on('waiting', () => {
      videojs.log('player is waiting')
    })

    player.on('dispose', () => {
      videojs.log('player will dispose')
    })
  }

  return <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
}

export default memo(VideoPlayer)