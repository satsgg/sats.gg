import { useState } from 'react'
import { UnsignedEvent } from 'nostr-tools'
import UnfollowHeart from '~/svgs/unfollow-heart.svg'
import FollowHeart from '~/svgs/follow-heart.svg'
import { verifySignature, validateEvent } from 'nostr-tools'
import { toast } from 'react-toastify'
import { nostrClient } from '~/nostr/NostrClient'
import useAuthStore from '~/hooks/useAuthStore'
import { Follows, signEventPrivkey } from '~/utils/nostr'
import { Event as NostrEvent } from 'nostr-tools'

export default function UnfollowButton({
  pubkey,
  follows,
  setFollows,
}: {
  pubkey: string
  follows: Follows
  setFollows: Function
}) {
  const [myPubkey, view, privkey] = useAuthStore((state) => [state.pubkey, state.view, state.privkey])

  const [hover, setHover] = useState(false)

  const handleUnfollowClick = async () => {
    if (!myPubkey) return
    let newFollows = [...follows.follows]
    // unfollow
    newFollows = newFollows.filter((f) => f !== pubkey)

    let tags = newFollows.map((f) => ['p', f])

    const createdAt = Math.floor(Date.now() / 1000)
    const event: UnsignedEvent = {
      kind: 3,
      pubkey: myPubkey,
      created_at: createdAt,
      tags: tags,
      content: '',
    }

    try {
      const signedEvent: NostrEvent | null =
        view === 'default' ? signEventPrivkey(event, privkey) : await window.nostr.signEvent(event)
      if (!signedEvent) throw new Error('Failed to sign event')
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      // TODO: Verify relays saw the event
      await nostrClient.publish(signedEvent)
      setFollows({
        follows: newFollows,
        createdAt: createdAt,
      })
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
        'bg-primary' relative hidden 
        h-8 items-center space-x-1 rounded bg-stone-700 px-3 py-1 hover:bg-red-400 sm:inline-flex
      `}
      onClick={handleUnfollowClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-tooltip="Unfollow"
      data-position="top"
      data-arrow
    >
      {hover ? (
        <UnfollowHeart height={20} width={20} strokeWidth={2.0} fill="white" />
      ) : (
        <FollowHeart height={20} width={20} strokeWidth={2.0} fill="white" className="stroke-white" />
      )}
    </button>
  )
}
