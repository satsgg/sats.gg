import { useProfile } from '~/hooks/useProfile'
import ProfileImg from '../ProfileImg'
import { displayName } from '~/utils/nostr'

export default function Participant({ pubkey }: { pubkey: string }) {
  const { profile, isLoading } = useProfile(pubkey)

  return (
    <div className="flex items-center gap-1">
      <div className="h-4 w-4 shrink-0">
        {isLoading ? (
          <div className="h-full w-full rounded-[50%] bg-gray-600" />
        ) : (
          <ProfileImg pubkey={pubkey} picture={profile?.picture} />
        )}
      </div>

      <p className="truncate text-xs text-white">{!isLoading && displayName(pubkey, profile)}</p>
    </div>
  )
}
