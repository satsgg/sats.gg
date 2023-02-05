import { Stream } from './Stream'
import { StreamBio } from './StreamBio'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'

type UserSingleOutput = inferProcedureOutput<AppRouter['user']['getUser']>
interface ChannelUserProps {
  channelUser: UserSingleOutput
}

export const StreamContainer = ({ channelUser }: ChannelUserProps) => {
  return (
    <div className="flex w-full grow flex-col">
      <div className="no-scrollbar flex grow flex-col overflow-y-auto">
        <div className="max-h-[calc(100vh-9rem)]">
          <Stream channelUser={channelUser} />
        </div>

        <StreamBio channelUser={channelUser} />
      </div>
    </div>
  )
}
