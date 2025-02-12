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
    <div className="relative mx-2 my-4">
      <div className="absolute -inset-[6px] rounded-xl bg-gradient-to-r from-amber-300 via-primary-400 to-orange-400 opacity-50 blur-[6px]"></div>
      <div className="absolute -inset-[3px] rounded-lg bg-gradient-to-r from-yellow-200 via-primary-300 to-amber-400 opacity-40 blur-[3px]"></div>
      <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-primary-400 via-yellow-300 to-primary-500 opacity-90"></div>
      <div className="relative flex items-start rounded-lg bg-background/95 px-2 py-2">
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
            <span className="ml-1 text-sm">zapped {fmtNumber(amount, true)} sats!</span>
          </p>
          <p className="mt-1 break-words text-sm">{fmtMsg(content)}</p>
        </div>
      </div>
    </div>
  )
}

export default ZapChatMessage
