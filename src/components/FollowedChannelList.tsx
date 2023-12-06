import { Virtuoso } from 'react-virtuoso'
import useFollows from '~/hooks/useFollows'
import useAuthStore from '~/hooks/useAuthStore'
import { FollowedChannelSingle } from './FollowedChannelSingle'
import OpenRightSVG from '~/svgs/open-right.svg'
import OpenLeftSVG from '~/svgs/open-left.svg'
import { useStreams } from '~/hooks/useStreams'
import { Stream } from '~/utils/nostr'

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
  const streams = useStreams('streams-followed', follows, false, follows.length)

  const liveFollows = () => {
    let liveFollows: { pubkey: string; stream: Stream | null }[] = []
    let allFollows = follows.slice()
    if (allFollows.length > 0 && streams.length > 0) {
      for (let stream of streams) {
        const index = allFollows.indexOf(stream.pubkey)
        if (index >= 0) {
          liveFollows.push({
            pubkey: stream.pubkey,
            stream: stream,
          })
        }
        allFollows.splice(index, 1)
      }
    }
    return liveFollows.concat(allFollows.map((f) => ({ pubkey: f, stream: null })))
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
              stream={user.stream}
              userCollapse={userCollapse}
              autoCollapse={autoCollapse}
            />
          )
        }}
      />
    </>
  )
}
