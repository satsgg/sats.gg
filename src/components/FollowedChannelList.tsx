import useAuthStore from '~/hooks/useAuthStore'
import { FollowedChannelSingle } from './FollowedChannelSingle'

export const FollowedChannelList = ({}) => {
  const { pubkey } = useAuthStore()

  // TODO: SSR this? Would probably require SSR for auth first
  // const { data: followedChannels, isLoading: followedChannelsIsLoading } = trpc.auth.getMeFollows.useQuery(undefined, {
  // WANT: https://reactjs.org/docs/reconciliation.html
  // It's fine to not exist on first load... but should be there when clicking around
  // shouldn't reload every page (same with auth)

  return (
    <div className="no-scrollbar grow overflow-y-auto bg-stone-800">
      <div className="flex flex-col justify-center">
        {true ? (
          <>
            <p className="py-2 px-4 text-center text-sm font-normal text-white">FOLLOWED CHANNELS</p>
            <div className="h-screen w-full border-4 border-cyan-500 bg-slate-500" />
          </>
        ) : (
          <>
            {pubkey && false ? (
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
