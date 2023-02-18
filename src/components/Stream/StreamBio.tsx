import { useState } from 'react'
import { z } from 'zod'
import { useProfile } from '~/hooks/useProfile'
import FollowHeartSVG from '~/svgs/follow-heart.svg'

export const StreamBio = ({ channelPubkey }: { channelPubkey: string} ) => {
  const profile = useProfile(channelPubkey)
  const [followAnimation, setFollowAnimation] = useState(false)

  // Figure out how to fix 'object is possibly null'. We know at this point channelUser exists
  // or else we would have never loaded this component
  // need to stop using infer, and make a fresh one or some

  return (
    <div className="flex grow flex-col gap-6 px-6 pt-4">
      <div className="flex content-center justify-between">
        <div className="flex">
          {profile && profile.picture ? 
            <img
              className={`mr-2 h-16 w-16 rounded-[50%] ${
                // channelUser.streamStatus === 'ACTIVE' ? 'border-2 border-primary p-1' : ''
                true ? 'border-2 border-primary p-1' : ''
              }`}
              src={profile.picture}
              alt={`profile image of ${channelPubkey}`}
            />
            :
            <div className="h-16 w-16 border rounded-[50%] border-gray-500" />   
          }
          <p className="font-semi text-lg text-white">{(profile && profile.name) ? profile.name : channelPubkey}</p>
        </div>
      </div>
      <div className="rounded bg-stone-800">
        <div className="p-12">
          <p className="font-semi text-xl text-white">About {profile?.name}</p>
          <p className="font-semi text-lg text-white">{profile?.about}</p>
        </div>
      </div>
      <div className="h-screen w-full border-4 border-cyan-500 bg-slate-500" />
    </div>
  )
}
