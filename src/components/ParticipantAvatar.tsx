import { useProfile } from '~/hooks/useProfile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { displayName } from '~/utils/nostr'
import Link from 'next/link'

export default function ParticipantAvatar({ pubkey, size = 'h-8 w-8' }: { pubkey: string; size?: string }) {
  const { isLoading, profile } = useProfile(pubkey)

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/watch/${pubkey}`} legacyBehavior={false}>
            <Avatar className={`inline-block rounded-full ring-2 ring-background ${size}`}>
              <AvatarImage src={profile?.picture} alt={'Participant'} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="border border-border bg-background text-foreground">
          {!isLoading && displayName(pubkey, profile).slice(0, 25)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
