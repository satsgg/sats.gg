import { useRef, memo, useEffect, useState } from 'react'
import usePlayerStore from '~/store/playerStore'

// This imports the functional component from the previous sample.
import VideoJS from './VideoJS'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'

import { Manifest, Parser } from 'm3u8-parser'

const VideoPlayer = ({ url }: { url: string }) => {
  const playerRef = useRef<Player | null>(null)
  const volume = usePlayerStore((state) => state.volume)
  const [manifest, setManifest] = useState<Manifest | null>(null)

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
        console.debug(parser.manifest.playlists)
        setManifest(parser.manifest)
        // TODO:
        // Decide if we should pop up a payment window if any free streams exist
        // can maybe just show a small popup - "Higher qualities for sats! vv"
        // can just start by always opening up a payment window if there is
        // at least 1 paid stream. Free streams can be shown and clickable.
      })
  }, [url])

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fill: true,
    enableLowInitialPlaylist: true,
    liveui: false,
    // inactivityTimeout: 100,
    playsinline: true,
    sources: [
      {
        // src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
        src: url ?? '',
        type: 'application/x-mpegURL',
        customTagParsers: [
          {
            expression: /#EXT-X-PRICE:(\d+)/,
            customType: 'price',
            dataParser: (line) => {
              const match = /#EXT-X-PRICE:(\d+)/.exec(line)
              return match && match[1] ? parseInt(match[1], 10) : null
            },
            segment: true,
          },
        ],
      },
    ],
    plugins: {
      // httpSourceSelector: {
      //   default: 'auto',
      // },
    },
  }

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player
    // player.httpSourceSelector()
    let qualityLevels = player.qualityLevels()
    console.debug('vhs quality levels', qualityLevels)

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
    let tech = player.tech({ IWillNotUseThisInPlugins: true })
    if (tech) {
      // console.debug('vhs representations', tech.vhs?.representations()))
      tech.on('loadedplaylist', () => {
        console.debug('vhs?')
        console.debug('vhs representations', tech.vhs?.representations())
        console.debug('tech.vhs.playlists.main', tech.vhs?.playlists?.main)
      })
      tech.on('loadedmetadata', () => {
        console.debug('vhs loadedmetadata')
        console.debug('vhs representations', tech.vhs?.representations())
      })
      tech.on('mediachange', () => {
        console.debug('vhs mediachange')
        // if max attempts for playlist is hit, need to make sure paying
        // for the variant resets the counter. Can maybe just trigger the load() function.
        // want it to be as seamless as possible
        console.debug('tech.vhs.playlists.main', tech.vhs?.playlists?.main)
      })
    }
  }

  return <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
}

export default memo(VideoPlayer)
