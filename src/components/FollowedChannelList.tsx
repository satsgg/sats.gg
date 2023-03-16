import { Virtuoso } from 'react-virtuoso'
import useFollows from '~/hooks/useFollows'
import useSettingsStore from '~/hooks/useSettingsStore'
import { FollowedChannelSingle } from './FollowedChannelSingle'
import OpenRightSVG from '~/svgs/open-right.svg'
import OpenLeftSVG from '~/svgs/open-left.svg'

export const FollowedChannelList = ({
  autoCollapse,
  userCollapse,
  setUserCollapse,
}: {
  autoCollapse: boolean
  userCollapse: boolean
  setUserCollapse: Function
}) => {
  const pubkey = useSettingsStore((state) => state.pubkey)
  const follows = useFollows(pubkey)

  return (
    <div className="no-scrollbar grow overflow-y-auto bg-stone-800">
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
        data={follows}
        className="no-scrollbar"
        itemContent={(index, user) => {
          return <FollowedChannelSingle key={index} pubkey={user} userCollapse={userCollapse} />
        }}
      />
    </div>
  )
}
