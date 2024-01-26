import Link from 'next/link'
import { useProfile } from '~/hooks/useProfile'
import LiveSVG from '~/svgs/live.svg'
import { nip19 } from 'nostr-tools'
import ProfileImg from './ProfileImg'
import { Stream, displayName, getStreamNaddr, getVerifiedChannelLink } from '~/utils/nostr'
import { fmtNumber } from '~/utils/util'

export const FollowedChannelSingle = ({
  pubkey,
  stream,
  userCollapse,
  autoCollapse,
}: {
  pubkey: string
  stream: Stream | null
  userCollapse: boolean
  autoCollapse: boolean
}) => {
  const { profile, isLoading } = useProfile(pubkey)
  const streamLink =
    getVerifiedChannelLink(profile) ||
    (stream
      ? getStreamNaddr(stream.providerPubkey || stream.pubkey, stream.d, stream.relays)
      : nip19.npubEncode(pubkey))

  console.debug('streamlink', `${streamLink}`)

  return (
    <Link href={`/${streamLink}`}>
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
            {/* TODO: tags */}
          </div>
        </div>

        <div className={`${userCollapse || autoCollapse ? 'hidden' : 'align-right'}`}>
          {stream && stream.status === 'live' ? (
            <span className="inline-flex gap-1">
              <LiveSVG width={20} height={20} className="fill-red-600" />
              {Number.isInteger(stream.currentParticipants) && (
                <span className="text-sm text-gray-100">{fmtNumber(stream.currentParticipants!, true)}</span>
              )}
            </span>
          ) : (
            <p className="text-sm font-light text-white">Offline</p>
          )}
        </div>
      </div>
    </Link>
  )
}
