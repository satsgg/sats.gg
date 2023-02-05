import { trpc } from '~/utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { FollowedChannelSingle } from './FollowedChannelSingle'
// TODO: Just pass array of followed channels?
// Separate query for
// type UserFollowsOutput = inferProcedureOutput<AppRouter['auth']['getMeFollows']>

export const useFollowedChannels = () => {
  const { user } = useAuthStore()

  return trpc.follow.getMyFollowedChannels.useQuery(undefined, {
    enabled: !!user?.id,
    refetchInterval: 30000,
  })
}

export const FollowedChannelList = ({}) => {
  const { user, status: authStatus } = useAuthStore()
  const { data: followedChannels, isLoading } = useFollowedChannels()

  // TODO: SSR this? Would probably require SSR for auth first
  // const { data: followedChannels, isLoading: followedChannelsIsLoading } = trpc.auth.getMeFollows.useQuery(undefined, {
  // WANT: https://reactjs.org/docs/reconciliation.html
  // It's fine to not exist on first load... but should be there when clicking around
  // shouldn't reload every page (same with auth)

  return (
    <div className="no-scrollbar grow overflow-y-auto bg-stone-800">
      <div className="flex flex-col justify-center">
        {authStatus == 'authenticated' && Array.isArray(followedChannels) && followedChannels.length ? (
          <>
            <p className="py-2 px-4 text-center text-sm font-normal text-white">FOLLOWED CHANNELS</p>
            {followedChannels.map((followedChannel) => {
              return <FollowedChannelSingle key={followedChannel.followingId} channel={followedChannel.following} />
            })}
            <div className="h-screen w-full border-4 border-cyan-500 bg-slate-500" />
          </>
        ) : (
          <>
            {user && !isLoading ? (
              // TODO: Fancier follow some channels (Maybe link to browse)
              <p className="py-2 px-4 text-center text-sm font-normal text-white">Follow some channels</p>
            ) : (
              <></>
            )}
          </>
        )}
      </div>
    </div>
  )
}
