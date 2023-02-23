import { Virtuoso } from 'react-virtuoso'
import useFollows from '~/hooks/useFollows'
import useSettingsStore from '~/hooks/useSettingsStore'
import { FollowedChannelSingle } from './FollowedChannelSingle'

export const FollowedChannelList = ({}) => {
  const pubkey = useSettingsStore(state => state.pubkey)
  const follows = useFollows(pubkey)

  return (
    <div className="no-scrollbar grow overflow-y-auto bg-stone-800">
      <Virtuoso
        data={follows}
        itemContent={(index, user) => {
          return <FollowedChannelSingle key={index} pubkey={user} />
        }}
      />
    </div>
  )
}
