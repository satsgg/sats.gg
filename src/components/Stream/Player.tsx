import { useRef, memo, useEffect, useState, useCallback } from 'react'
import usePlayerStore from '~/store/playerStore'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import './videojs-hls-quality-selector'
import VideoJS from './VideoJS'
import VideoJSBridgeComponent from './VideoJSBridgeComponent'
import TitleOverlay from './TitleOverlay'
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
  const [selectedQualityIndex, setSelectedQualityIndex] = useState<number>(-1)
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [openPaywall, setOpenPaywall] = useState(false)

  useEffect(() => {
    if (!playerRef.current || !options.sources?.length) return

    console.debug('Updating player source with:', options.sources[0].src)
    playerRef.current.src(options.sources[0])
    // when a source is loaded we got the 30311, so we can reset the poster
    playerRef.current.poster(options.poster)
  }, [JSON.stringify(options)])

  useEffect(() => {
    if (!playerRef.current) return

    const titleOverlay = playerRef.current.getChild('TitleOverlay')
    if (titleOverlay) {
      console.log('Updating title overlay with:', {
        title: options.title,
        profilePicUrl: options.profilePicUrl,
      })
      titleOverlay.update({
        title: options.title,
        profilePicUrl: options.profilePicUrl,
      })
    }
  }, [options.title, options.profilePicUrl])

  useEffect(() => {
    if (!playerRef.current) return
    playerRef.current.l402 = l402
  }, [l402])

  // useEffect(() => {
  //   return () => {
  //     if (playerRef.current) {
  //       playerRef.current.dispose()
  //       playerRef.current = null
  //     }
  //   }
  // }, [])

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

      console.log('Adding TitleOverlay with options:', {
        title: options.title,
        profilePicUrl: options.profilePicUrl,
      })

      player.addChild('TitleOverlay', {
        title: options.title,
        profilePicUrl: options.profilePicUrl,
      })

      if (options.sources?.length) {
        // console.debug('Setting initial source:', options.sources[0].src)
        player.src(options.sources[0])
      }

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
        console.debug('change: quality event ', event)
        setSelectedQualityIndex(event.selectedIndex)
        // setQualityLevels(playerQualityLevels.levels_)
        for (let i = 0; i < qualityLevels.length; i++) {
          const qualityLevel = qualityLevels[i]
          console.debug('on change Quality Level', i, 'Price:', qualityLevel?.price)
        }
      })

      // Register the VideoJSBridgeComponent
      videojs.registerComponent('VideoJSBridgeComponent', VideoJSBridgeComponent)

      // Add the VideoJSBridgeComponent to the player
      player.addChild('VideoJSBridgeComponent', {
        paymentCallback: (l402: Lsat) => {
          console.debug('Player paymentCallback', l402)
          setL402(l402)
        },
      })

      // Get a reference to the Video.js bridge component
      const modalComponent = player.getChild('VideoJSBridgeComponent')

      // Create a button in the control bar to toggle the modal
      // player.controlBar.addChild('button', {
      //   text: 'Toggle Modal',
      //   clickHandler: () => modalComponent?.toggleModal(),
      // })

      player.on('waiting', () => {
        videojs.log('player is waiting')
      })

      player.on('dispose', () => {
        videojs.log('player will dispose')
        qualityLevelsRef.current = null
        qualitySelectorRef.current = null
      })

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

      // Move VHS setup to loadstart event
      player.on('loadstart', () => {
        let tech = player.tech({ IWillNotUseThisInPlugins: true })
        console.debug('l402-hls: tech', tech)
        if (tech) {
          console.debug('l402-hls: if tech', tech)
          if (tech.vhs) {
            console.debug('l402-hls: if tech.vhs', tech.vhs)
            const playerResponseHook = (request, error, response) => {
              const bar = response.headers.foo
              // console.debug('on response', error, response)
              if (response.statusCode === 402) {
                console.debug('l402-hls: on response 402')
                setL402((l402) => {
                  if (!l402) return null
                  if (Math.floor(Date.now() / 1000) > l402.validUntil) {
                    return null
                  }
                  return l402
                })
                console.debug('l402-hls: SETTING OPEN paywall')
                // setOpenPaywall(true)
                modalComponent?.openModal()
              }
            }
            console.debug('l402-hls: SETTING ON RESPONSE', tech.vhs)
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
      })
    },
    [volume, JSON.stringify(options)],
  )

  return <VideoJS options={options} onReady={handlePlayerReady} l402={l402} />
}

export default memo(VideoPlayer)
