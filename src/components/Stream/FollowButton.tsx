import { useState } from 'react'
import { Event as NostrEvent } from 'nostr-tools'
import useSettingsStore from '~/hooks/useSettingsStore'
import FollowHeartSVG from '~/svgs/follow-heart.svg'
import { verifySignature, validateEvent } from 'nostr-tools'
import { toast } from 'react-toastify'
import { nostrClient } from '~/nostr/NostrClient'

export default function FollowButton({ pubkey }: { pubkey: string }) {
  const follows = useSettingsStore((state) => state.follows)
  const myPubkey = useSettingsStore((state) => state.pubkey)
  const followsUser = follows.includes(pubkey)
  const myself = pubkey === myPubkey
  const [followAnimation, setFollowAnimation] = useState(false)

  const handleFollowClick = async () => {
    if (!myPubkey) return
    let newFollows = [...follows]
    if (followsUser) {
      // unfollow
      newFollows = newFollows.filter((f) => f !== pubkey)
    } else {
      // follow
      newFollows.push(pubkey)
    }

    let tags = newFollows.map((f) => ['p', f])

    const event: NostrEvent = {
      kind: 3,
      pubkey: myPubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: '',
    }

    try {
      const signedEvent = await window.nostr.signEvent(event)
      console.debug('signedEvent', signedEvent)
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      console.debug('event id', signedEvent.id)
      nostrClient.publish(signedEvent)
      if (!followsUser) setFollowAnimation(true)
    } catch (err: any) {
      console.error(err.message)
      toast.error(err.message, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  return (
    <button
      className={`
        ${followsUser && !followAnimation ? 'bg-stone-700' : 'bg-primary'} 
        ${myself && 'hidden'}
        inline-flex h-8 items-center space-x-1 rounded px-3 py-1
      `}
      onClick={handleFollowClick}
      onAnimationEnd={() => setFollowAnimation(false)}
    >
      <FollowHeartSVG
        height={20}
        width={20}
        strokeWidth={2.0}
        fill={followsUser ? 'white ' : 'none'}
        className={`${followAnimation && 'animate-wiggle'}`}
      />
      <span className={`${followsUser && !followAnimation && 'hidden'} text-sm font-semibold capitalize`}>follow</span>
    </button>
  )
}
