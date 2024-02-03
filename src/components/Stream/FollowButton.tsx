import { useState } from 'react'
import { UnsignedEvent } from 'nostr-tools'
import FollowHeartSVG from '~/svgs/follow-heart.svg'
import { verifySignature, validateEvent } from 'nostr-tools'
import { toast } from 'react-toastify'
import { nostrClient } from '~/nostr/NostrClient'
import useAuthStore from '~/hooks/useAuthStore'
import { Follows, signEventPrivkey } from '~/utils/nostr'
import { Event as NostrEvent } from 'nostr-tools'

export default function FollowButton({
  pubkey,
  follows,
  setFollows,
}: {
  pubkey: string
  follows: Follows
  setFollows: Function
}) {
  const [myPubkey, view, privkey] = useAuthStore((state) => [state.pubkey, state.view, state.privkey])

  const handleFollowClick = async () => {
    if (!myPubkey) return
    let newFollows = [...follows.follows]
    newFollows.push(pubkey)

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
        group relative hidden h-8 items-center space-x-1 rounded bg-primary px-3
        py-1 sm:inline-flex
      `}
      onClick={handleFollowClick}
    >
      <FollowHeartSVG
        height={20}
        width={20}
        strokeWidth={2.0}
        fill="none"
        className={`transform stroke-white transition group-hover:scale-125 group-hover:fill-white`}
      />
      <span className="text-sm font-semibold capitalize text-white">follow</span>
    </button>
  )
}
