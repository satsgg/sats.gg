import { useState } from 'react'
import { z } from 'zod'
import { useProfile } from '~/hooks/useProfile'
import FollowHeartSVG from '~/svgs/follow-heart.svg'
import { nip19 } from 'nostr-tools'

export const StreamBio = ({ channelPubkey }: { channelPubkey: string} ) => {
  const profile = useProfile(channelPubkey)
  const [hideImg, setHideImg] = useState(false)
  const [followAnimation, setFollowAnimation] = useState(false)

  // Figure out how to fix 'object is possibly null'. We know at this point channelUser exists
  // or else we would have never loaded this component
  // need to stop using infer, and make a fresh one or some

  return (
    <div className="flex grow flex-col gap-6 px-6 pt-4">
      <div className="flex content-center justify-between">
        <div className="flex">
          <img 
            className="mr-2 h-16 w-16 rounded-[50%]" 
            src={profile?.picture || `https://robohash.org/${channelPubkey}.png?bgset=bg1`}
            onError={(e) => {
              e.target.src = `https://robohash.org/${channelPubkey}.png?bgset=bg1`
              e.target.onerror = null
            }}
          />
          <p className="font-semi text-lg text-white">{(profile?.name) ? profile.name.slice(0,12) : nip19.npubEncode(channelPubkey)}</p>
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
