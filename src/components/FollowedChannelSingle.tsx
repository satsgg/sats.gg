import Link from 'next/link'
import { useProfile } from '~/hooks/useProfile'
import LiveSVG from '~/svgs/live.svg'
import { nip19 } from 'nostr-tools'
import { useState } from 'react'
import NostrichImg from '~/assets/Nostrich.jpeg'

export const FollowedChannelSingle = ({ pubkey, collapse }: { pubkey: string; collapse: boolean }) => {
  const profile = useProfile(pubkey)

  return (
    <Link href={`/${nip19.npubEncode(pubkey)}`}>
      <div className="flex grow justify-between py-2 px-2 hover:cursor-pointer hover:bg-stone-700/25">
        <div className="flex shrink-0">
          <img
            className={`${collapse ? '' : 'mr-2'} h-8 w-8 rounded-[50%]`}
            src={profile?.picture || `https://robohash.org/${pubkey}.png`}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = NostrichImg.src
            }}
          />
          {/* next/Image won't work b/c each image src has to be configured in next.config.js 
              We could set it to **... 
          */}
          {/* <ImageWithFallback 
            width={20}
            height={20}
            src={profile?.picture || `https://robohash.org/${pubkey}`}
            fallbackSrc={NostrichImg} 
          /> */}
          <div className={`${collapse ? 'hidden' : 'flex flex-col '}`}>
            <p className="text-sm font-semibold text-white">
              {profile?.name ? profile.name.slice(0, 12) : nip19.npubEncode(pubkey).slice(0, 12)}
            </p>
            {/* TODO: Live stream category */}
          </div>
        </div>
        {/* TODO: live viewer count */}
        <div className={`${collapse ? 'hidden' : 'align-right'}`}>
          {false ? (
            <LiveSVG width={20} height={20} className="fill-red-600" />
          ) : (
            <p className="text-sm font-light text-white">Offline</p>
          )}
        </div>
      </div>
    </Link>
  )
}
