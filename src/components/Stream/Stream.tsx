import { useEffect, useRef } from 'react'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import videojs from 'video.js'
import useAuthStore from '~/hooks/useAuthStore'
import StreamSkeleton from './StreamSkeleton'

type GetUserOutput = inferProcedureOutput<AppRouter['user']['getUser']>

// export const Stream = ({ channelUser }: { channelUser: GetUserOutput }) => {
// TODO: Replace channelUser with noteID?
// what if user clicks on a user they follow? Support both pubkey and noteID links?
export const Stream = () => {
  // if (!channelUser) return <StreamSkeleton />
  const viewerPubkey = useAuthStore((state) => state.pubkey)
  const videoEl = useRef(null)

  const attemptPlay = () => {
    // videoEl &&
    //   videoEl.current &&
    //   videoEl.current.play().catch(error => {
    //     console.error("Error attempting to play", error);
    //   });
    // console.log('attempting play')
    videoEl.current
      ?.play()
      .then(function () {
        // autoplay was successful!
        // console.log('AUTOPLAY')
      })
      .catch(function (error) {
        // do something if you want to handle or track this error
        // console.log('no autoplay', error)
      })
  }

  useEffect(() => {
    attemptPlay()
  }, [videoEl])

  // Banner offline display
  // if (channelUser?.streamStatus === 'IDLE') {
  //   return (
  //     <div className="flex items-center justify-center bg-stone-900 w-full h-1/4">
  //       <p className="text-white text-3xl">Offline</p>
  //     </div>
  //   )
  // }

  // return (
  // <div className="min-h-full border-2 border-red-600 2xl:border-white"></div>
  // <div className="max-h-[calc(100vh-32rem)] aspect-video border-2 border-red-600 2xl:border-white"></div>
  // )

  // Player skeleton offline display
  // if (channelUser?.streamStatus === 'IDLE') {
  //   return (
  //     <div className="flex h-full w-full items-center justify-center bg-black">
  //       {/* TODO: Better channel offline display */}
  //       <p className="text-3xl text-white">Offline</p>
  //     </div>
  //   )
  // }

  return <video className="video-js aspect-video h-full max-h-[calc(100vh-9rem)]" />
}
