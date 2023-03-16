import { useProfile } from '~/hooks/useProfile'
import FollowButton from './FollowButton'
import { nip19 } from 'nostr-tools'
import ProfileImg from '../ProfileImg'

export const StreamBio = ({ channelPubkey }: { channelPubkey: string }) => {
  const { profile, isLoading } = useProfile(channelPubkey)

  const getProfileName = () => {
    if (isLoading) return ''
    else if (profile?.name) {
      return profile.name
    } else {
      return nip19.npubEncode(channelPubkey)
    }
  }

  return (
    <div className="flex grow flex-col gap-4 px-4 py-2 md:px-6 md:py-4">
      <div className="flex gap-2">
        <div className="h-12 w-12 shrink-0 md:h-16 md:w-16">
          <ProfileImg pubkey={channelPubkey} isLoading={isLoading} picture={profile?.picture} />
        </div>

        <div className="flex w-full min-w-0 justify-between">
          <span className=" font-semi min-h-0 truncate text-lg text-white">{getProfileName()}</span>
          <FollowButton pubkey={channelPubkey} />
        </div>
      </div>

      <div className="hidden rounded bg-stone-800 p-12 sm:block">
        <p className="font-semi text-xl text-white">About {profile?.name}</p>
        <p className="font-semi text-lg text-white">{profile?.about}</p>
      </div>

      <div className="hidden h-screen w-full border-4 border-cyan-500 bg-slate-500 sm:block" />
    </div>
  )
}
