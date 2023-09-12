import { useRef } from 'react'

// This imports the functional component from the previous sample.
import VideoJS from './VideoJS'

const Player = () => {
  const playerRef = useRef(null)

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    sources: [
      {
        src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
        type: 'application/x-mpegURL',
      },
    ],
  }

  const handlePlayerReady = (player) => {
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

export default Player
