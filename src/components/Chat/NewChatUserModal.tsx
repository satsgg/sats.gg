import { Event as NostrEvent } from 'nostr-tools'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { displayName } from '~/utils/nostr'
import { useProfile } from '~/hooks/useProfile'
import { Zap } from 'lucide-react'
import { X } from 'lucide-react'

type ModalPosition = {
  top: number
}

interface ChatUserModalProps {
  pubkey: string
  modalPosition: ModalPosition
  closeUserModal: () => void
}

export default function ChatUserModal({ pubkey, modalPosition, closeUserModal }: ChatUserModalProps) {
  const { profile, isLoading } = useProfile(pubkey)

  return (
    <div className="absolute left-0 right-0 bg-card p-4 shadow-lg" style={{ top: `${modalPosition.top}px` }}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.picture} alt="Chat user profile picture" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold">{displayName(pubkey, profile).slice(0, 15)}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={closeUserModal}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex space-x-2">
        {/* <Button variant="outline" onClick={toggleZapMode}> */}
        <Button variant="outline">
          <Zap className="mr-2 h-4 w-4" />
          Zap
        </Button>
        <Button>Follow</Button>
      </div>
    </div>
  )

  return (
    // <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
    <div className="absolute left-0 right-0 bg-card p-4 shadow-lg" style={{ top: `${modalPosition.top}px` }}>
      <div className="w-full max-w-sm rounded-lg bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.picture} alt="Chat user profile picture" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{displayName(pubkey, profile).slice(0, 15)}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={closeUserModal}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button className="flex-grow">Follow</Button>
          {/* <Button variant="outline" onClick={toggleZapMode}> */}
          <Button variant="outline">
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
