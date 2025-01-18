import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface TitleOverlayContentProps {
  title?: string
  profilePicUrl?: string
}

const TitleOverlayContent: React.FC<TitleOverlayContentProps> = ({ title, profilePicUrl }) => {
  // Don't render anything if either title or profilePicUrl is missing
  if (!title || !profilePicUrl) {
    return null
  }

  const handleClick = () => {
    // Remove '/embed' from the current URL to get the main site URL
    const mainUrl = window.location.href.replace('/embed', '')
    window.open(mainUrl, '_blank')
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
