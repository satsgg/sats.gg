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
    <div className="flex grow flex-col">
      <div className="aspect-video">
        <Stream channelUser={channelUser} />
      </div>

      <StreamBio channelUser={channelUser} />
    </div>
  )
}
