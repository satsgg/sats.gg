import Link from 'next/link'
import LiveSVG from '~/svgs/live.svg'

export const FollowedChannelSingle = ({ pubkey }: { pubkey: string }) => {
  return (
    <Link href={`/p/${pubkey}`}>
      <div className="flex grow justify-between py-2 px-2 hover:cursor-pointer hover:bg-stone-700/25">
        <div className="flex">
          <img
            className="mr-2 h-8 w-8 rounded-[50%]"
            src={'https://picsum.photos/250'}
            alt={`profile image of ${pubkey}`}
          />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white">{pubkey.slice(0, 12)}</p>
            {/* TODO: Live stream category */}
          </div>
        </div>
        {/* TODO: live viewer count */}
        <div className="align-right">
          {false ? (
            <LiveSVG width={20} height={20} className="fill-red-600" />
          ) : (
            <p className="text-sm font-light text-white">Offline</p>
          )}
        </div>
      </div>
    </Link>
  )
}
