import Link from 'next/link'
import { useProfile } from '~/hooks/useProfile'
import LiveSVG from '~/svgs/live.svg'
import { nip19 } from 'nostr-tools'
import ProfileImg from './ProfileImg'
import { StreamStatus } from '@prisma/client'
import { displayName, getVerifiedChannelLink } from '~/utils/nostr'
import { fmtViewerCnt } from '~/utils/util'
import { trpc } from '~/utils/trpc'

export const FollowedChannelSingle = ({
  pubkey,
  userCollapse,
  autoCollapse,
  status,
  viewerCount,
}: {
  pubkey: string
  userCollapse: boolean
  autoCollapse: boolean
  status: StreamStatus
  viewerCount: number
}) => {
  const { profile, isLoading } = useProfile(pubkey)

  // update their live viewer count
  trpc.user.getUser.useQuery({ pubkey: pubkey }, { refetchInterval: 15000, enabled: status === StreamStatus.ACTIVE })

  return (
    <Link href={getVerifiedChannelLink(profile) || `/${nip19.npubEncode(pubkey)}`}>
      <div className="flex justify-between gap-2 py-2 px-2 hover:cursor-pointer hover:bg-stone-700/25">
        <div className="flex min-w-0">
          <div className={`${userCollapse ? '' : 'mr-2'} h-8 w-8 shrink-0`}>
            {isLoading ? (
              <div className="h-full w-full rounded-[50%] bg-gray-600" />
            ) : (
              <ProfileImg pubkey={pubkey} picture={profile?.picture} />
            )}
          </div>

          <div className={`${userCollapse || autoCollapse ? 'hidden' : 'flex flex-col'} min-w-0`}>
            <p className="truncate text-sm font-semibold text-white">{!isLoading && displayName(pubkey, profile)}</p>
            {/* TODO: Live stream category */}
          </div>
        </div>

        <div className={`${userCollapse || autoCollapse ? 'hidden' : 'align-right'}`}>
          {status === StreamStatus.ACTIVE ? (
            <span className="inline-flex gap-1">
              <LiveSVG width={20} height={20} className="fill-red-600" />
              <span className="text-sm text-gray-100">{fmtViewerCnt(viewerCount, true)}</span>
            </span>
          ) : (
            <p className="text-sm font-light text-white">Offline</p>
          )}
        </div>
      </div>
    </Link>
  )
}
