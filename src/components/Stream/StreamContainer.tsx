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
    <div className="flex min-w-0 grow flex-col overflow-y-auto">
      {/* <div className="min-h-0"> */}
      <div className="max-h-[calc(100vh-8rem)]">
        <Stream channelUser={channelUser} />
      </div>
      {/* </div> */}

      <StreamBio channelUser={channelUser} />
    </div>
  )
}
