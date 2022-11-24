import { useState } from 'react'
import { trpc } from '~/utils/trpc'
import { z } from 'zod'
import { inferProcedureOutput, inferProcedureInput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import useAuthStore from '~/store/useAuthStore'
import { useFollowedChannels } from '~/components/FollowedChannelList'

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill={followsUser ? '' : 'none'}
                    stroke="currentColor"
                    strokeWidth={followsUser ? 0 : 2.0}
                    className={`${followAnimation && 'animate-wiggle'} h-5 w-5 ${followsUser && 'fill-white'}`}
                  >
                    <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                  </svg>
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
      <div className="grow rounded bg-stone-800">
        <div className="p-12">
          <p className="font-semi text-xl text-white">About {channelUser?.userName}</p>
          <p className="font-semi text-lg text-white">{channelUser?.bio}</p>
        </div>
      </div>
    </div>
  )
}
