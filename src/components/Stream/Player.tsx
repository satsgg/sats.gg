import { useRef, memo, useEffect, useState, useCallback } from 'react'
import usePlayerStore from '~/store/playerStore'

// This imports the functional component from the previous sample.
import VideoJS from './VideoJS'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import './videojs-hls-quality-selector'
// import './L402Modal'

import { Manifest, Parser } from 'm3u8-parser'
import Paywall from './Paywall'
import { Lsat } from 'lsat-js'

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
  const [l402, setL402] = useState<Lsat | null>(null)
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
    if (!playerRef.current) return
    playerRef.current.l402 = l402
  }, [l402])

  // use to debug exclusion
  // useEffect(() => {
  //   let timer = setInterval(() => {
  //     if (!playerRef.current) return
  //     let reps = playerRef.current.tech().vhs?.representations()
  //     for (let i = 0; i < reps.length; i++) {
  //       const rep = reps[i]
  //       let excluded = false
  //       if (rep.playlist.excludeUntil) {
  //         excluded = Date.now() < rep.playlist.excludeUntil
  //       }
  //       console.debug(
  //         'rep',
  //         rep.height,
  //         'enabled: ',
  //         !rep.playlist.disabled,
  //         'excludeUntil',
  //         rep.playlist.excludeUntil,
  //         'excluded:',
  //         excluded,
  //       )
  //     }
  //   }, 5000)
  //   return () => {
  //     clearInterval(timer)
  //   }
  // }, [playerRef.current])

  // const validL402 = (selectedQuality: QualityLevel, l402: Lsat) => {
  //   // check bandwidth and expiration
  //   // console.debug('l402.isExpired', l402.isExpired()) // doesn't work
  //   console.debug('manual expired check', Math.floor(Date.now() / 1000) > l402.validUntil)
  //   if (Math.floor(Date.now() / 1000) > l402.validUntil) return false
  //   console.debug('bitrate comparison', selectedQuality.bitrate > l402.maxBandwidth)
  //   if (selectedQuality.bitrate > l402.maxBandwidth) return false
  //   return true
  // }

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
        // TODO: if quality level has a price and we have no valid l402, disable
        if (qualityLevel.price && qualityLevel.price > 0) {
          console.debug('Quality level disabled', qualityLevel)
          qualityLevel.enabled = false
        }
        setQualityLevels(playerQualityLevels.levels_)
      })
      playerQualityLevels.on('removequalitylevel', function (event: any) {
        const qualityLevel = event.qualityLevel
        console.debug('Quality Level Removed:', qualityLevel)
      })

      playerQualityLevels.on('change', function (event: any) {
        console.debug('change: setting selected quality index', event.selectedIndex)
        setSelectedQualityIndex(event.selectedIndex)
        // setQualityLevels(playerQualityLevels.levels_)
        for (let i = 0; i < qualityLevels.length; i++) {
          const qualityLevel = qualityLevels[i]
          console.debug('on change Quality Level', i, 'Price:', qualityLevel.price)
        }
      })

      // player.l402Modal({
      //   content: 'Please pay to continue watching this premium content.',
      //   paymentAmount: 1000,
      //   paymentUnit: 'sats',
      //   paymentCallback: function () {
      //     // Implement your payment logic here
      //     console.log('Payment button clicked')
      //     // After successful payment:
      //     // player.l402Modal().hideModal();
      //   },
      // })

      // never fires...
      // player.on('xhr-hooks-ready', () => {
      // console.debug('xhr hooks ready')
      // videojs.log('xhr hooks are ready')
      // const playerResponseHook = (request, error, response) => {
      //   const bar = response.headers.foo
      //   console.debug('on response', error, response)
      // }
      // if (player.tech().vhs) {
      //   player.tech().vhs.xhr.onResponse(playerResponseHook)
      // }
      // })

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
        if (tech.vhs) {
          const playerResponseHook = (request, error, response) => {
            const bar = response.headers.foo
            // console.debug('on response', error, response)
            if (response.statusCode === 402) {
              // console.debug('on response 402')
              setL402((l402) => {
                if (!l402) return null
                if (Math.floor(Date.now() / 1000) > l402.validUntil) {
                  return null
                }
                return l402
              })
              console.debug('SETTING OPEN paywall')
              setOpenPaywall(true)
            }
          }
          console.debug('SETTING ON RESPONSE', tech.vhs)
          tech.vhs.xhr.onResponse(playerResponseHook)
        }
        tech.on('loadedplaylist', () => {
          // doesn't fire
          console.debug('vhs loadedplaylist representations', tech.vhs?.representations())
          // console.debug('tech.vhs.playlists.main', tech.vhs?.playlists?.main)
        })
        tech.on('loadedmetadata', () => {
          console.debug('loadedmetadata')
          // Fired after the first segment is downloaded
          // for a playlist. This will not happen until playback
          // if video.js's metadata setting is none
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
      <VideoJS options={options} onReady={handlePlayerReady} l402={l402} />
      {openPaywall && (
        <Paywall
          playerRef={playerRef}
          qualitySelectorRef={qualitySelectorRef}
          qualityLevels={qualityLevels}
          setL402={setL402}
          close={() => setOpenPaywall(false)}
        />
      )}
    </>
  )
}

export default memo(VideoPlayer)
