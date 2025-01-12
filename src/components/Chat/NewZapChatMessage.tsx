import { useProfile } from '~/hooks/useProfile'
import { fmtNumber } from '~/utils/util'
import { displayName } from '~/utils/nostr'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { fmtMsg } from '~/utils/util'

const ZapChatMessage = ({
  channelPubkey,
  pubkey,
  amount,
  content,
  openUserModal,
}: {
  channelPubkey: string
  pubkey: string
  amount: number
  content: string
  openUserModal: (pubkey: string, event: React.MouseEvent) => void
}) => {
  // TODO: Fix flashing
  const { profile, isLoading } = useProfile(pubkey)

  return (
    <div className={`mb-2 flex items-start rounded-lg bg-primary-500/70 p-2 dark:bg-primary-500/30`}>
      <Avatar className="mr-1 h-5 w-5 flex-shrink-0">
        <AvatarImage src={profile?.picture} alt={'Profile Picture'} />
        <AvatarFallback>{pubkey.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-grow">
        <p className="break-words text-sm">
          <Button
            variant="ghost"
            className="h-auto p-0 text-sm font-semibold hover:bg-transparent"
            onClick={(e) => openUserModal(pubkey, e)}
          >
            {displayName(pubkey, profile).slice(0, 15)}
          </Button>
          <span className="ml-1 text-sm ">zapped {fmtNumber(amount, true)} sats!</span>
        </p>
        <p className="mt-1 break-words text-sm">{fmtMsg(content)}</p>
      </div>
    </div>
  )
}

export default ZapChatMessage
