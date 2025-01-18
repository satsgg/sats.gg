import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getStreamNaddr } from '~/utils/nostr'

interface TitleOverlayContentProps {
  title?: string
  profilePicUrl?: string
  pubkey?: string
  streamIdentifier?: string
  relays?: string[]
}

const TitleOverlayContent: React.FC<TitleOverlayContentProps> = ({
  title,
  profilePicUrl,
  pubkey,
  streamIdentifier,
  relays,
}) => {
  // Don't render anything if either title or profilePicUrl is missing
  if (!title || !profilePicUrl || !pubkey || !streamIdentifier) {
    return null
  }

  const handleClick = () => {
    const naddr = getStreamNaddr(pubkey, streamIdentifier, relays)
    window.open(`${window.location.origin}/${naddr}`, '_blank')
  }

  return (
    <div className="vjs-title-overlay absolute top-0 left-0 right-0 z-[100] p-4">
      <div
        className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-black/60 px-3 py-2 transition-colors hover:bg-black/80"
        onClick={handleClick}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={profilePicUrl} alt="Profile Picture" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
    </div>
  )
}

export default TitleOverlayContent
