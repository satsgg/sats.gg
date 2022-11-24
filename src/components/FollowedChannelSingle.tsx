import Link from 'next/link'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 fill-red-600">
              <path
                fillRule="evenodd"
                d="M12,15 C10.3431458,15 9,13.6568542 9,12 C9,10.3431458 10.3431458,9 12,9 C13.6568542,9 15,10.3431458 15,12 C15,13.6568542 13.6568542,15 12,15 Z M12,13 C12.5522847,13 13,12.5522847 13,12 C13,11.4477153 12.5522847,11 12,11 C11.4477153,11 11,11.4477153 11,12 C11,12.5522847 11.4477153,13 12,13 Z M4.40763162,4.03999996 L5.88598639,5.3951585 C4.11104506,7.039065 3,9.38961875 3,11.999671 C3,14.6097232 4.11104506,16.960277 5.88598639,18.6041835 L4.40763162,19.959342 C2.30811432,17.956119 1,15.1306582 1,11.999671 C1,8.86868372 2.30811432,6.04322293 4.40763162,4.03999996 Z M7.36666437,6.75244665 L8.85249694,8.11445984 C7.72232482,9.03117054 7,10.4310668 7,11.999671 C7,13.5682752 7.72232482,14.9681714 8.85249694,15.8848821 L7.36666437,17.2468953 C5.91524966,15.9643116 5,14.0888753 5,11.999671 C5,9.91046666 5.91524966,8.03503036 7.36666437,6.75244665 Z M19.5923684,4.04032898 C21.6918857,6.04355195 23,8.86901274 23,12 C23,15.1309873 21.6918857,17.956448 19.5923684,19.959671 L18.1140136,18.6045125 C19.8889549,16.960606 21,14.6100522 21,12 C21,9.38994777 19.8889549,7.03939402 18.1140136,5.39548753 L19.5923684,4.04032898 Z M16.6333356,6.75277568 C18.0847503,8.03535938 19,9.91079568 19,12 C19,14.0892043 18.0847503,15.9646406 16.6333356,17.2472243 L15.1475031,15.8852111 C16.2776752,14.9685004 17,13.5686042 17,12 C17,10.4313958 16.2776752,9.03149957 15.1475031,8.11478886 L16.6333356,6.75277568 Z"
              />
            </svg>
          ) : (
            <p className="text-sm font-light text-white">Offline</p>
          )}
        </div>
      </div>
    </Link>
  )
}
