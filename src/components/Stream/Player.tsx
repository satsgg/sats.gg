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

type QualityLevel = {
  bitrate: number
  framerate?: number
  price?: number
  height: number
  width: number
}

// const VideoPlayer = ({ url }: { url: string }) => {
const VideoPlayer = ({ options }: { options: any }) => {
  const playerRef = useRef<Player | null>(null)
  const qualityLevelsRef = useRef(null)
  const qualitySelectorRef = useRef(null)
  // console.debug('playerRef render', playerRef)
  console.debug('player render')
  const volume = usePlayerStore((state) => state.volume)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedQualityIndex, setSelectedQualityIndex] = useState<number>(-1)
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [openPaywall, setOpenPaywall] = useState(false)
  // console.debug('qualityLevels', qualityLevels)

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
      // player.hlsQualitySelector({
      //   displayCurrentQuality: true,
      // })
      // player.hlsQualitySelector = videojsqualityselector
      qualitySelectorRef.current = player.hlsQualitySelector({
        displayCurrentQuality: true,
      })
      // var qualitySelector = player.hlsQualitySelector({displayCurrentQuality:true});

      // maybe set a ref to this
      let playerQualityLevels = player.qualityLevels()
      qualityLevelsRef.current = playerQualityLevels
      // console.debug('vhs quality levels', playerQualityLevels)
      // TODO: if there are no free quality levels and the user has no valid l402,
      // open up the paywall
      // TODO: Get l402 from storage
      // let watchableQuality = false
      // for (let i = 0; i < playerQualityLevels.length; i++) {
      //   const qualityLevel = playerQualityLevels[i]
      //   console.debug('quality level in loop', qualityLevel)
      //   if (!qualityLevel.price) {
      //     watchableQuality = true
      //     break
      //   }
      // }
      // if (!watchableQuality) {
      //   // open paywall
      //   setOpenPaywall(true)
      // }

      playerQualityLevels.on('addqualitylevel', function (event) {
        const qualityLevel = event.qualityLevel
        console.debug('Quality Level Added:', qualityLevel)
        // TODO: if quality level has a price and we have no valid l402, disable
        if (qualityLevel.price && qualityLevel.price > 0) {
          console.debug('disabling quality level', qualityLevel)
          qualityLevel.enabled = false
        }
        setQualityLevels(playerQualityLevels.levels_)
      })

      playerQualityLevels.on('change', function (event) {
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
        // console.debug('vhs representations', tech.vhs?.representations()))
        tech.on('loadedplaylist', () => {
          // console.debug('vhs?')
          // console.debug('vhs representations', tech.vhs?.representations())
          // console.debug('tech.vhs.playlists.main', tech.vhs?.playlists?.main)
        })
        tech.on('loadedmetadata', () => {
          // console.debug('vhs loadedmetadata')
          // console.debug('vhs representations', tech.vhs?.representations())
        })
        tech.on('mediachange', () => {
          // console.debug('vhs mediachange')
          // if max attempts for playlist is hit, need to make sure paying
          // for the variant resets the counter. Can maybe just trigger the load() function.
          // want it to be as seamless as possible
          // console.debug('tech.vhs.playlists.main', tech.vhs?.playlists?.main)
        })
      }
    },
    [volume],
  )

  // return <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
  return (
    <>
      <VideoJS options={options} onReady={handlePlayerReady} />
      {openPaywall && qualityLevels && (
        <div className="absolute bottom-0 left-0 z-[101] flex h-full max-h-full w-full min-w-0 flex-col items-center justify-center gap-4 overflow-y-auto">
          <div className="bg-primary flex w-full flex-col rounded border bg-stone-900 p-4 xl:w-1/2">
            <div className="flex w-full items-center">
              <div className="w-1/12"></div>
              <h1 className="w-10/12 text-center text-xl font-bold">Select Quality</h1>
              <div className="w-1/12">
                <button onClick={() => setOpenPaywall(false)}>
                  <Exit height={25} width={25} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {qualityLevels &&
                qualityLevelsRef.current &&
                qualityLevels.map((q, p) => (
                  <Button
                    key={p}
                    onClick={() => {
                      if (!q.price || q.price === 0) {
                        console.debug('free selected')
                        qualitySelectorRef.current._qualityButton.items[p].handleClick()
                        playerRef.current.play()
                        setOpenPaywall(false)
                      }
                      // setSelectedQualityIndex(p);
                      // setSelectedQuality(q);
                      // setPrice(60 * q.price);
                      // setModal('duration');
                    }}
                  >
                    {q.height}p, {q.price === 0 || !q.price ? 'free' : q.price + ' millisats/sec'}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default memo(VideoPlayer)
