import { useProfile } from '~/hooks/useProfile'
import { nip19 } from 'nostr-tools'

// TODO: Need to filter out emojis from names
// Use display names? names?
// nip05 > display_name > name > pubkey ?
// ex. 🛠️gourcetools

const unicodeNameRegex =
  /(?![*#0-9]+)[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu

const ChatUser = ({ pubkey }: { pubkey: string }) => {
  const { profile, isLoading } = useProfile(pubkey)

  const fmtName = (name: string) => {
    const formatted = name.replace(unicodeNameRegex, '')
    return formatted
  }

  if (profile && profile.name) {
    return <span className="text-sm text-orange-300">{fmtName(profile.name.slice(0, 15))}</span>
  }

  return <span className="text-sm text-orange-300">{nip19.npubEncode(pubkey).slice(0, 12)}</span>
}

export default ChatUser
