import { Virtuoso } from 'react-virtuoso'
import useFollows from '~/hooks/useFollows'
import useAuthStore from '~/hooks/useAuthStore'
import { FollowedChannelSingle } from './FollowedChannelSingle'
import OpenRightSVG from '~/svgs/open-right.svg'
import OpenLeftSVG from '~/svgs/open-left.svg'
import { trpc } from '~/utils/trpc'
import { StreamStatus } from '@prisma/client'

export const FollowedChannelList = ({
  autoCollapse,
  userCollapse,
  setUserCollapse,
}: {
  autoCollapse: boolean
  userCollapse: boolean
  setUserCollapse: Function
}) => {
  const pubkey = useAuthStore((state) => state.pubkey)
  const follows = useFollows(pubkey)

  const { data: streams, isLoading, isError } = trpc.live.getLiveStreams.useQuery(undefined, { refetchInterval: 15000 })

  // short term way to handle which pubkeys are live...
  // will need to sort again once view count is added...
  // live status should eventually be based off a nostr note
  // TODO: Run less often
  const liveFollows = () => {
    let liveFollows: { pubkey: string; streamStatus: StreamStatus; viewerCount: number }[] = []
    let allFollows = follows.slice()
    if (allFollows.length > 0 && streams && streams.length > 0) {
      for (let stream of streams) {
        let index = allFollows.indexOf(stream.publicKey)
        if (index >= 0) {
          liveFollows.push({
            pubkey: stream.publicKey,
            streamStatus: StreamStatus.ACTIVE,
            viewerCount: stream.viewerCount,
          })
          allFollows.splice(index, 1)
        }
      }
    }
    liveFollows.sort((a, b) => b.viewerCount - a.viewerCount)
    return liveFollows.concat(allFollows.map((f) => ({ pubkey: f, streamStatus: StreamStatus.IDLE, viewerCount: 0 })))
  }

  return (
    <>
      <div
        className={`
          ${autoCollapse ? 'hidden' : ''} 
          ${userCollapse ? 'justify-center' : 'justify-between'} 
          flex shrink-0 p-2`}
      >
        <div className="flex flex-col justify-center">
          <p className={`${userCollapse ? 'hidden' : ''} align-middle text-sm uppercase text-white`}>
            followed channels
          </p>
        </div>
        <button onClick={() => setUserCollapse(!userCollapse)}>
          {userCollapse ? (
            <OpenRightSVG width={24} height={24} strokeWidth={2} className="stroke-white" />
          ) : (
            <OpenLeftSVG width={24} height={24} strokeWidth={2} className="stroke-white" />
          )}
        </button>
      </div>
      <Virtuoso
        data={liveFollows()}
        className="no-scrollbar"
        itemContent={(index, user) => {
          return (
            <FollowedChannelSingle
              key={index}
              pubkey={user.pubkey}
              userCollapse={userCollapse}
              autoCollapse={autoCollapse}
              status={user.streamStatus}
              viewerCount={user.viewerCount}
            />
          )
        }}
      />
    </>
  )
}
