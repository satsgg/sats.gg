import Link from 'next/link'
import { useProfile } from '~/hooks/useProfile'
import LiveSVG from '~/svgs/live.svg'
import { nip19 } from 'nostr-tools'
import ProfileImg from './ProfileImg'
import { StreamStatus } from '@prisma/client'

export const FollowedChannelSingle = ({
  pubkey,
  userCollapse,
  autoCollapse,
  status,
}: {
  pubkey: string
  userCollapse: boolean
  autoCollapse: boolean
  status: StreamStatus
}) => {
  const { profile, isLoading } = useProfile(pubkey)

  const getProfileName = () => {
    if (isLoading) return ''
    else if (profile?.name) {
      return profile.name.slice(0, 12)
    } else {
      return nip19.npubEncode(pubkey).slice(0, 12)
    }
  }

  return (
    <Link href={`/${nip19.npubEncode(pubkey)}`}>
      <div className="flex grow justify-between py-2 px-2 hover:cursor-pointer hover:bg-stone-700/25">
        <div className="flex shrink-0">
          <div className={`${userCollapse ? '' : 'mr-2'} h-8 w-8`}>
            <ProfileImg pubkey={pubkey} isLoading={isLoading} picture={profile?.picture} />
          </div>
          {/* next/Image won't work b/c each image src has to be configured in next.config.js 
              We could set it to **... 
          */}
          {/* <ImageWithFallback 
            width={20}
            height={20}
            src={profile?.picture || `https://robohash.org/${pubkey}`}
            fallbackSrc={NostrichImg} 
          /> */}
          <div className={`${userCollapse || autoCollapse ? 'hidden' : 'flex flex-col'}`}>
            <p className="text-sm font-semibold text-white">{getProfileName()}</p>
            {/* TODO: Live stream category */}
          </div>
        </div>

        {/* TODO: live viewer count */}
        <div className={`${userCollapse || autoCollapse ? 'hidden' : 'align-right'}`}>
          {status === StreamStatus.ACTIVE ? (
            <LiveSVG width={20} height={20} className="fill-red-600" />
          ) : (
            <p className="text-sm font-light text-white">Offline</p>
          )}
        </div>
      </div>
    </Link>
  )
}
