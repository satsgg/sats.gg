import { useEffect, useRef } from 'react'
// import MuxPlayer from '@mux/mux-player-react/lazy'
import MuxPlayer from '@mux/mux-player-react'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import useAuthStore from '~/hooks/useAuthStore'
import StreamSkeleton from './StreamSkeleton'

// NOTE: Bug or something with lazy mux loader
// placeholder (btwn DOM/placeholder and actual video loading) doesn't respect
// h-full. It only does the aspect ratio. So when the dev console is open
// and max v height is the used, the palceholder doesn't respect the max v height

// want lazy loader because it makes the DOM content load wayyy faster...
// just have the issue with the placeholder

type GetUserOutput = inferProcedureOutput<AppRouter['user']['getUser']>

export const Stream = ({ channelUser }: { channelUser: GetUserOutput }) => {
  if (!channelUser) return <StreamSkeleton />
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

  return (
    <MuxPlayer
      streamType="ll-live"
      playbackId={channelUser.playbackId}
      // title="hi"
      // debug
      // autoPlay
      // debug
      ref={videoEl}
      muted={false}
      // disableCookies
      // loading="viewport"
      // placeholder={Nostrich.src}
      className={'aspect-video h-full'}
      metadata={{
        env_key: process.env.NEXT_PUBLIC_MUX_ENV_KEY || '',
        video_id: channelUser.streamId,
        video_title: channelUser?.streamTitle || '',
        viewer_user_id: viewerPubkey,
      }}
    />
  )
}
