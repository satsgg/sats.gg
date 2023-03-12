import { useState } from 'react'
import { useProfile } from '~/hooks/useProfile'
import FollowButton from './FollowButton'
import { nip19 } from 'nostr-tools'
import NostrichImg from '~/assets/Nostrich.jpeg'

export const StreamBio = ({ channelPubkey }: { channelPubkey: string }) => {
  const profile = useProfile(channelPubkey)

  // Figure out how to fix 'object is possibly null'. We know at this point channelUser exists
  // or else we would have never loaded this component
  // need to stop using infer, and make a fresh one or some

  return (
    <div className="flex grow flex-col gap-4 px-4 py-2 md:px-6 md:py-4">
      <div className="flex content-center justify-between">
        <div className="flex">
          <img
            className="mr-2 h-12 w-12 rounded-[50%] md:h-16 md:w-16"
            src={profile?.picture || `https://robohash.org/${channelPubkey}.png`}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = NostrichImg.src
            }}
          />
          <p className="font-semi text-lg text-white">
            {profile?.name ? profile.name.slice(0, 12) : nip19.npubEncode(channelPubkey)}
          </p>
        </div>

        <FollowButton />
      </div>

      <div className="hidden rounded bg-stone-800 p-12 sm:block">
        <p className="font-semi text-xl text-white">About {profile?.name}</p>
        <p className="font-semi text-lg text-white">{profile?.about}</p>
      </div>

      <div className="hidden h-screen w-full border-4 border-cyan-500 bg-slate-500 sm:block" />
    </div>
  )
}
