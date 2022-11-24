import MuxPlayer from '@mux/mux-player-react'
import { inferProcedureOutput } from '@trpc/server'
import { useEffect, useRef } from 'react'
import { AppRouter } from '~/server/routers/_app'

type UserSingleOutput = inferProcedureOutput<AppRouter['user']['getUser']>
interface UserSingleProps {
  user: UserSingleOutput
}

export const Stream = ({ channelUser }: UserSingleProps) => {
  const videoEl = useRef(null)

  console.log('playbackid', channelUser.playbackId)
  console.log('channelUser', channelUser)
  const attemptPlay = () => {
    // videoEl &&
    //   videoEl.current &&
    //   videoEl.current.play().catch(error => {
    //     console.error("Error attempting to play", error);
    //   });
    console.log('attempting play')
    videoEl.current
      ?.play()
      .then(function () {
        // autoplay was successful!
        console.log('AUTOPLAY')
      })
      .catch(function (error) {
        // do something if you want to handle or track this error
        console.log('no autoplay', error)
      })
  }

  useEffect(() => {
    attemptPlay()
  }, [videoEl, channelUser.streamStatus])

  // Banner offline display
  // if (channelUser?.streamStatus === 'IDLE') {
  //   return (
  //     <div className="flex items-center justify-center bg-stone-900 w-full h-1/4">
  //       <p className="text-white text-3xl">Offline</p>
  //     </div>
  //   )
  // }

  // Player skeleton offline display
  if (channelUser?.streamStatus === 'IDLE') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        {/* TODO: Better channel offline display */}
        <p className="text-3xl text-white">Offline</p>
      </div>
    )
  }

  return (
    <MuxPlayer
      streamType="ll-live"
      playbackId={channelUser?.playbackId}
      // playbackId="v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM"
      // title="hi"
      // debug
      envKey="06ap5jkfhpso2kfdumgvn5ml9"
      // autoPlay
      // debug
      ref={videoEl}
      muted={false}
      // disableCookies
      // tokens={{
      //   playback: "zkma4FkEBYfNGXf6dcu9t3qcFpeLRpGT0001R5xDOVGkI",
      //   thumbnail: "zkma4FkEBYfNGXf6dcu9t3qcFpeLRpGT0001R5xDOVGkI"
      // }}
      metadata={{
        video_id: 'video-id-54321',
        video_title: 'Test video title',
        status: channelUser?.streamStatus,
        // viewer_user_id: "chad1",
      }}
    />
  )
}
