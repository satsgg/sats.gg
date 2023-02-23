import Link from 'next/link'
import { useProfile } from '~/hooks/useProfile'
import LiveSVG from '~/svgs/live.svg'
import { nip19 } from 'nostr-tools'
import { useState } from 'react'

export const FollowedChannelSingle = ({ pubkey }: { pubkey: string }) => {
  const [hideImg, setHideImg] = useState(false)
  const profile = useProfile(pubkey)

  return (
    <Link href={`/${nip19.npubEncode(pubkey)}`}>
      <div className="flex grow justify-between py-2 px-2 hover:cursor-pointer hover:bg-stone-700/25">
        <div className="flex">
          {profile?.picture && !hideImg? (
              <img className="mr-2 h-8 w-8 rounded-[50%]" onError={() => setHideImg(true)} src={profile?.picture ?? undefined} alt={`profile pic of ${pubkey}`}/>
            ) : (
              <div className="mr-2 h-8 w-8 rounded-[50%] border border-gray-500"></div>
            )}
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white">{(profile?.name) ? profile.name.slice(0,12) : nip19.npubEncode(pubkey).slice(0,12)}</p>
            {/* TODO: Live stream category */}
          </div>
        </div>
        {/* TODO: live viewer count */}
        <div className="align-right">
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
