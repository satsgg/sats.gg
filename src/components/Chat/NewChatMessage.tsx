import { Event as NostrEvent } from 'nostr-tools'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { displayName } from '~/utils/nostr'
import { useProfile } from '~/hooks/useProfile'

interface Message {
  pubkey: string
  channelPubkey: string
  note: NostrEvent
  openUserModal: (pubkey: string, event: React.MouseEvent) => void
}

export default function ChatMessage({ pubkey, channelPubkey, note, openUserModal }: Message) {
  const { profile, isLoading } = useProfile(note.pubkey)

  return (
    <div className="relative mx-2 my-2">
      <div className="mx-2 my-2 flex items-start">
        <Avatar className="mr-1 h-5 w-5 flex-shrink-0">
          <AvatarImage src={profile?.picture} alt={'Profile Picture'} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-grow">
          <p className="break-words text-sm">
            <Button
              variant="ghost"
              className="h-auto p-0 text-sm font-semibold text-muted-foreground"
              onClick={(e) => openUserModal(pubkey, e)}
            >
              {displayName(pubkey, profile).slice(0, 15)}
            </Button>
            : {note.content}
          </p>
        </div>
      </div>
    </div>
  )
}
