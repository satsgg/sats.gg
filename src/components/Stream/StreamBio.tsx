import { useState } from 'react'
import { trpc } from '~/utils/trpc'
import { z } from 'zod'
import { inferProcedureOutput, inferProcedureInput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import useAuthStore from '~/hooks/useAuthStore'
import { useFollowedChannels } from '~/components/FollowedChannelList'
import FollowHeartSVG from '~/svgs/follow-heart.svg'

type UserSingleOutput = inferProcedureOutput<AppRouter['user']['getUser']>
interface ChannelUserProps {
  channelUser: UserSingleOutput
}

type FollowUserInput = inferProcedureInput<AppRouter['follow']['followUser']>

export const followUserInput = z.object({
  userId: z.string().uuid(),
})

export const StreamBio = ({ channelUser }: ChannelUserProps) => {
  const { user } = useAuthStore()
  const { refetch: refetchFollowedChannels } = useFollowedChannels()
  const [followAnimation, setFollowAnimation] = useState(false)

  // Figure out how to fix 'object is possibly null'. We know at this point channelUser exists
  // or else we would have never loaded this component
  // need to stop using infer, and make a fresh one or some

  // Logged in and not yourself
  const shouldLoadFollowsUser = !!user?.id && channelUser.id !== user?.id
  const {
    data: followsUser,
    isLoading: isLoadingFollowsUser,
    refetch: refetch,
  } = trpc.follow.followsUser.useQuery(
    {
      userId: channelUser.id,
    },
    {
      enabled: shouldLoadFollowsUser,
    },
  )

  const followUserMutation = trpc.follow.followUser.useMutation()

  const onSubmitFollowUser = async () => {
    setFollowAnimation(true)
    const res = await followUserMutation.mutateAsync({ userId: channelUser.id })
    refetch()
    refetchFollowedChannels()
    console.log(res)
  }

  const unfollowUserMutation = trpc.follow.unfollowUser.useMutation()
  const onSubmitUnfollowUser = async () => {
    const res = await unfollowUserMutation.mutateAsync({ userId: channelUser.id })
    refetch()
    refetchFollowedChannels()
    console.log(res)
  }

  return (
    <div className="flex grow flex-col gap-6 px-6 pt-4">
      <div className="flex content-center justify-between">
        <div className="flex">
          <img
            className={`mr-2 h-16 w-16 rounded-[50%] ${
              channelUser.streamStatus === 'ACTIVE' ? 'border-2 border-primary p-1' : ''
            }`}
            src={channelUser.profileImage ?? 'https://picsum.photos/250'}
            alt={`profile image of ${channelUser.userName}`}
          />
          <p className="font-semi text-lg text-white">{channelUser?.userName}</p>
        </div>
        <div className="align-center flex max-h-max gap-2">
          {/* TODO: Clean up these buttons */}
          {shouldLoadFollowsUser ? (
            <>
              {!isLoadingFollowsUser ? (
                <button
                  onClick={followsUser ? onSubmitUnfollowUser : onSubmitFollowUser}
                  className={
                    followsUser && !followAnimation
                      ? 'h-10 rounded bg-slate-700 px-3 py-2 text-sm font-semibold'
                      : 'hover-shadow-lg inline-flex h-10 items-center space-x-1 rounded bg-primary px-3 py-1 shadow-md'
                  }
                  onAnimationEnd={() => setFollowAnimation(false)}
                >
                  <FollowHeartSVG
                    width={20}
                    height={20}
                    strokeWidth={followsUser ? 0 : 2.0}
                    fill={followsUser ? '' : 'none'}
                    className={`${followAnimation && 'animate-wiggle'} ${followsUser && 'fill-white'}`}
                  />
                  {(!followsUser || followAnimation) && <span className="text-sm font-semibold">Follow</span>}
                </button>
              ) : (
                <div className="h-10 w-10 animate-pulse rounded-md bg-gray-700" />
              )}
            </>
          ) : (
            <></>
          )}
          <button className="inline-flex h-10 items-center rounded bg-primary px-3 py-2 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg">
            Subscribe
          </button>
          <button className="inline-flex h-10 items-center rounded bg-primary px-3 py-2 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg">
            Boost
          </button>
        </div>
      </div>
      <div className="rounded bg-stone-800">
        <div className="p-12">
          <p className="font-semi text-xl text-white">About {channelUser?.userName}</p>
          <p className="font-semi text-lg text-white">{channelUser?.bio}</p>
        </div>
      </div>
    </div>
  )
}
