import { Virtuoso } from 'react-virtuoso'
import useFollows from '~/hooks/useFollows'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useState } from 'react'
import { FollowedChannelSingle } from './FollowedChannelSingle'
import OpenRightSVG from '~/svgs/open-right.svg'
import OpenLeftSVG from '~/svgs/open-left.svg'

export const FollowedChannelList = ({ collapse, setCollapse }: { collapse: boolean; setCollapse: Function }) => {
  const pubkey = useSettingsStore((state) => state.pubkey)
  const follows = useFollows(pubkey)

  return (
    <div className="no-scrollbar grow overflow-y-auto bg-stone-800">
      <div className={`${collapse ? 'justify-center' : 'justify-between'} flex shrink-0 p-2`}>
        <p className={`${collapse ? 'hidden' : 'text-sm uppercase text-white'}`}>followed channels</p>
        <button onClick={() => setCollapse(!collapse)}>
          {collapse ? (
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
          return <FollowedChannelSingle key={index} pubkey={user} collapse={collapse} />
        }}
      />
    </div>
  )
}
