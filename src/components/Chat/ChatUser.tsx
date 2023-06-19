import { useProfile } from '~/hooks/useProfile'
import { displayName } from '~/utils/nostr'

const unicodeNameRegex =
  /(?![*#0-9]+)[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu

const ChatUser = ({ pubkey }: { pubkey: string }) => {
  const { profile, isLoading } = useProfile(pubkey)

  const fmtName = (name: string) => {
    const formatted = name.replace(unicodeNameRegex, '')
    return formatted
  }

  return (
    <a href={`https://nostr.com/p/${pubkey}`} target="_blank">
      <span className="text-sm text-orange-300">{fmtName(displayName(pubkey, profile).slice(0, 15))}</span>
    </a>
  )
}

export default ChatUser
