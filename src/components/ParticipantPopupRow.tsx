import { useProfile } from '~/hooks/useProfile'
import { displayName } from '~/utils/nostr'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export default function ParticipantPopupRow({ pubkey }: { pubkey: string }) {
  const { isLoading, profile } = useProfile(pubkey)

  return (
    <Link href={`/${pubkey}`} legacyBehavior={false}>
      <div className="flex cursor-pointer items-center space-x-2 hover:bg-accent">
        <Avatar className="h-6 w-6">
          <AvatarImage src={profile?.picture} alt={'Participant'} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <span className="text-sm">{!isLoading && displayName(pubkey, profile).slice(0, 25)}</span>
      </div>
    </Link>
  )
}
