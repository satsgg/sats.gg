import { useRef, memo, useEffect } from 'react'
import usePlayerStore from '~/store/playerStore'

// This imports the functional component from the previous sample.
import VideoJS from './VideoJS'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'

import { Parser } from 'm3u8-parser'

const VideoPlayer = ({ url }: { url: string }) => {
  const playerRef = useRef<Player | null>(null)
  const volume = usePlayerStore((state) => state.volume)

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((m3u8Text) => {
        console.debug(m3u8Text)
        let parser = new Parser()
        parser.addParser({
          expression: /#EXT-X-PRICE:(\d+)/,
          customType: 'price',
          dataParser: (line) => {
            const match = /#EXT-X-PRICE:(\d+)/.exec(line)
            return match && match[1] ? parseInt(match[1], 10) : null
          },
          segment: true,
        })
        parser.push(m3u8Text)
        parser.end()
        console.debug('parsedManifest', parser.manifest)
      })
  }, [url])

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    liveui: false,
    // inactivityTimeout: 100,
    playsinline: true,
    sources: [
      {
        // src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
        src: url ?? '',
        type: 'application/x-mpegURL',
      },
    ],
  }

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
    const handlePause = () => {
      const seekToLive = () => {
        if (player.duration() === Infinity) {
          player.currentTime(player.seekable().end(0))
        }
      }

      player.on('play', seekToLive)
    }
    player.on('pause', handlePause)

    player.volume(volume)
  }

  return <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
}

export default memo(VideoPlayer)
