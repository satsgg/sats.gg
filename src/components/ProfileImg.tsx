import { useState } from 'react'
import NostrichImg from '~/assets/nostrich.jpeg'

const ProfileImg = ({
  pubkey,
  isLoading,
  picture,
  streamStatus = null,
}: {
  pubkey: string
  isLoading: boolean
  picture: string | undefined
  streamStatus?: string | null | undefined
}) => {
  const [imgLoaded, setImgLoaded] = useState(false)
  const getImgUrl = () => {
    if (isLoading) {
      return null
    } else if (picture) {
      return picture
    } else {
      return `https://robohash.org/${pubkey}.png`
    }
  }

  return (
    <>
      {isLoading || !imgLoaded ? <div className="h-full w-full rounded-[50%] bg-gray-600"></div> : null}
      <img
        className={`
          ${imgLoaded ? '' : 'hidden'} 
          ${streamStatus === 'ACTIVE' && 'border-2 border-primary p-1'} 
          h-full
          w-full rounded-[50%]
        `}
        // src={profile?.picture || `https://robohash.org/${channelPubkey}.png`}
        // src={profile?.picture}
        src={getImgUrl()}
        onLoad={() => setImgLoaded(true)}
        onError={(e) => {
          e.target.onerror = null
          e.target.src = NostrichImg.src
        }}
      />
    </>
  )
}

export default ProfileImg
