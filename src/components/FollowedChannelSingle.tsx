import Link from 'next/link'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import LiveSVG from '~/svgs/live.svg'

type FollowedChannelSingleOutput = inferProcedureOutput<AppRouter['follow']['getMyFollowedChannels']>[0]['following']

interface FollowedChannelSingleProps {
  channel: FollowedChannelSingleOutput
}

export const FollowedChannelSingle = ({ channel }: FollowedChannelSingleProps) => {
  return (
    <Link href={`/${channel.userName}`}>
      <div className="flex grow justify-between py-2 px-2 hover:cursor-pointer hover:bg-stone-700/25">
        <div className="flex">
          <img
            className="mr-2 h-8 w-8 rounded-[50%]"
            src={channel.profileImage ?? 'https://picsum.photos/250'}
            alt={`profile image of ${channel.userName}`}
          />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white">{channel.userName}</p>
            {/* TODO: Live stream category */}
          </div>
        </div>
        {/* TODO: live viewer count */}
        <div className="align-right">
          {channel.streamStatus === 'ACTIVE' ? (
            <LiveSVG width={20} height={20} className="fill-red-600" />
          ) : (
            <p className="text-sm font-light text-white">Offline</p>
          )}
        </div>
      </div>
    </Link>
  )
}
