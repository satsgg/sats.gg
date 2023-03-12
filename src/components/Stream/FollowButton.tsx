import { useState } from 'react'
import FollowHeartSVG from '~/svgs/follow-heart.svg'

export default function FollowButton() {
  const [followAnimation, setFollowAnimation] = useState(false)
  // TODO: Get this based off follows lsit
  const [followsUser, setFollowsUser] = useState(false)

  const handleFollowClick = () => {
    if (followsUser) {
      setFollowsUser(false)
      return
    }

    setFollowAnimation(true)
    setFollowsUser(true)
  }

  return (
    <div className="align-center flex max-h-max gap-2">
      <button
        className={`${
          followsUser && !followAnimation ? 'bg-stone-700' : 'bg-primary'
        } inline-flex h-8 items-center space-x-1 rounded px-3 py-1`}
        onClick={handleFollowClick}
        onAnimationEnd={() => setFollowAnimation(false)}
      >
        <FollowHeartSVG
          height={20}
          width={20}
          strokeWidth={2.0}
          fill={followsUser ? 'white ' : 'none'}
          // className={`${followAnimation && 'animate-wiggle'} ${followsUser ? 'fill-white' : 'fill-none'} `}
          className={`${followAnimation && 'animate-wiggle'}`}
        />
        <span className={`${followsUser && !followAnimation && 'hidden'} text-sm font-semibold capitalize`}>
          follow
        </span>
      </button>
    </div>
  )
}
