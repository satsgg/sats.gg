import { useRef, memo, useEffect, useState, useCallback } from 'react'
import usePlayerStore from '~/store/playerStore'

// This imports the functional component from the previous sample.
import VideoJS from './VideoJS'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import './videojs-hls-quality-selector'
import Exit from '~/svgs/x.svg'

import { Manifest, Parser } from 'm3u8-parser'
import Button from '../Button'
import Paywall from './Paywall'

type QualityLevel = {
  bitrate: number
  framerate?: number
  price?: number
  height: number
  width: number
  resolvedUri: string
}

const VideoPlayer = ({ options }: { options: any }) => {
  const playerRef = useRef<Player | null>(null)
  const qualityLevelsRef = useRef(null)
  const qualitySelectorRef = useRef(null)
  const volume = usePlayerStore((state) => state.volume)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedQualityIndex, setSelectedQualityIndex] = useState<number>(-1)
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [openPaywall, setOpenPaywall] = useState(false)

  // useEffect(() => {
  //   fetch(url)
  //     .then((res) => res.text())
  //     .then((m3u8Text) => {
  //       console.debug(m3u8Text)
  //       let parser = new Parser()
  //       parser.addParser({
  //         expression: /#EXT-X-PRICE:(\d+)/,
  //         customType: 'price',
  //         dataParser: (line) => {
  //           const match = /#EXT-X-PRICE:(\d+)/.exec(line)
  //           return match && match[1] ? parseInt(match[1], 10) : null
  //         },
  //         segment: true,
  //       })
  //       parser.push(m3u8Text)
  //       parser.end()
  //       // console.debug('parsedManifest', parser.manifest)
  //       // console.debug(parser.manifest.playlists)
  //       setManifest(parser.manifest)
  //       // TODO:
  //       // Decide if we should pop up a payment window if any free streams exist
  //       // can maybe just show a small popup - "Higher qualities for sats! vv"
  //       // can just start by always opening up a payment window if there is
  //       // at least 1 paid stream. Free streams can be shown and clickable.
  //     })
  // }, [url])

  // const videoJsOptions = {
  //   autoplay: true,
  //   controls: true,
  //   responsive: true,
  //   fill: true,
  //   enableLowInitialPlaylist: true,
  //   liveui: false,
  //   // inactivityTimeout: 100,
  //   playsinline: true,
  //   sources: [
  //     {
  //       // src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
  //       src: url ?? '',
  //       type: 'application/x-mpegURL',
  //       customTagParsers: [
  //         {
  //           expression: /#EXT-X-PRICE:(\d+)/,
  //           customType: 'price',
  //           dataParser: (line) => {
  //             const match = /#EXT-X-PRICE:(\d+)/.exec(line)
  //             return match && match[1] ? parseInt(match[1], 10) : null
  //           },
  //           segment: true,
  //         },
  //       ],
  //     },
  //   ],
  //   plugins: {
  //     // httpSourceSelector: {
  //     //   default: 'auto',
  //     // },
  //   },
  // }

  useEffect(() => {
    console.debug('firing')
    console.debug('selectedQualityIndex', selectedQualityIndex)
    console.debug('qualityLevels.length', qualityLevels.length)
    const selectedQuality = qualityLevels[selectedQualityIndex]
    console.debug('selectedQualityLevel', selectedQuality)
    console.debug('qualityLevels', qualityLevels)
    console.debug('ref qualityLevels', qualityLevelsRef.current)
    // if (selectedQualityIndex > -1 || qualityLevels.length === 0) return
    if (!selectedQuality) return
    console.debug('EHERE')
    // console.debug('selectedQualityIndex', selectedQualityIndex)
    // const selectedQuality = qualityLevels[selectedQualityIndex]
    if (selectedQuality?.price && selectedQuality.price > 0) {
      console.debug('setting open paywall')
      setOpenPaywall(true)
    }
  }, [selectedQualityIndex, qualityLevels])

  const handlePlayerReady = useCallback(
    (player: Player) => {
      playerRef.current = player
      qualitySelectorRef.current = player.hlsQualitySelector({
        displayCurrentQuality: true,
      })

      let playerQualityLevels = player.qualityLevels()
      qualityLevelsRef.current = playerQualityLevels

      playerQualityLevels.on('addqualitylevel', function (event: any) {
        const qualityLevel = event.qualityLevel
        console.debug('Quality Level Added:', qualityLevel)
        // TODO: if quality level has a price and we have no valid l402, disable
        if (qualityLevel.price && qualityLevel.price > 0) {
          console.debug('disabling quality level', qualityLevel)
          qualityLevel.enabled = false
        }
        setQualityLevels(playerQualityLevels.levels_)
      })

      playerQualityLevels.on('change', function (event: any) {
        // TODO: If quality level has a price and we do not have a valid l402, request payment
        // console.debug('qualityLevels change', event)
        console.debug('change: setting selected quality index', event.selectedIndex)
        setSelectedQualityIndex(event.selectedIndex)
        // if (qualityLevel?.price && qualityLevel.price > 0) {
        //   setOpenPaywall(true)
        // }
        // console.log('New level:', qualityLevels[qualityLevels.selectedIndex]);
        // setQualityLevels(playerQualityLevels.levels_)
        // for (let i = 0; i < qualityLevels.length; i++) {
        //   const qualityLevel = qualityLevels[i]
        //   console.debug('Quality Level', i, 'Price:', qualityLevel.price)
        // }
      })

      // console.debug('quality selector', player.hlsQualitySelector())

      // You can handle player events here, for example:
      player.on('waiting', () => {
        videojs.log('player is waiting')
      })

      player.on('dispose', () => {
        videojs.log('player will dispose')
        qualityLevelsRef.current = null
        qualitySelectorRef.current = null
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
        tech.on('loadedplaylist', () => {
          console.debug('vhs representations', tech.vhs?.representations())
          // console.debug('tech.vhs.playlists.main', tech.vhs?.playlists?.main)
        })
        tech.on('loadedmetadata', () => {
          // console.debug('vhs loadedmetadata')
          console.debug('vhs representations', tech.vhs?.representations())
        })
        tech.on('mediachange', () => {
          // console.debug('tech.vhs.playlists.main', tech.vhs?.playlists?.main)
        })
      }
    },
    [volume],
  )

  return (
    <>
      <VideoJS options={options} onReady={handlePlayerReady} />
      {openPaywall && (
        <Paywall
          playerRef={playerRef}
          qualitySelectorRef={qualitySelectorRef}
          qualityLevels={qualityLevels}
          close={() => setOpenPaywall(false)}
        />
      )}
    </>
  )
}

export default memo(VideoPlayer)
