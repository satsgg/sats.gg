import { useState } from 'react'
import { trpc } from '~/utils/trpc'
import { z } from 'zod'
import useAuthStore from '~/hooks/useAuthStore'
import { useFollowedChannels } from '~/components/FollowedChannelList'
import FollowHeartSVG from '~/svgs/follow-heart.svg'
import { channel } from 'diagnostics_channel'

export const followUserInput = z.object({
  userId: z.string().uuid(),
})

export const StreamBio = ({ channelPubkey }: { channelPubkey: string }) => {
  const { pubkey } = useAuthStore()
  const { refetch: refetchFollowedChannels } = useFollowedChannels()
  const [followAnimation, setFollowAnimation] = useState(false)

  // Figure out how to fix 'object is possibly null'. We know at this point channelUser exists
  // or else we would have never loaded this component
  // need to stop using infer, and make a fresh one or some

  // Logged in and not yourself
  const shouldLoadFollowsUser = !!pubkey && channelPubkey !== pubkey

  return (
    <div className="flex grow flex-col gap-6 px-6 pt-4">
      <div className="h-screen w-full border-4 border-cyan-500 bg-slate-500" />
    </div>
  )
}
