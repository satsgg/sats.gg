import { useProfile } from '~/hooks/useProfile'
import { trpc } from '~/utils/trpc'
import { displayName } from '~/utils/nostr'
import ProfileImg from '~/components/ProfileImg'

// i like bg-stone-600...
const DummyStreamCard = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video h-full w-full rounded bg-stone-800"></div>

      <div className="flex h-16 gap-2">
        <div className="">
          <div className="h-8 w-8 rounded-[50%] bg-stone-800"></div>
        </div>
        <div className="flex h-full w-full flex-col gap-2">
          <div className="h-full w-3/5 rounded bg-stone-800" />
          <div className="h-full w-1/2 rounded bg-stone-800" />
        </div>
      </div>
    </div>
  )
}

const dummyLiveChannels = []

const StreamCard = ({ pubkey }: { pubkey: string }) => {
  const { profile, isLoading } = useProfile(pubkey)

  if (isLoading) return <DummyStreamCard />

  return (
    <div className="flex flex-col gap-2">
      {/* TODO: Thumbnail */}
      <div className="aspect-video h-full w-full rounded bg-stone-800"></div>

      <div className="flex h-16 gap-2">
        <div className="">
          <div className="h-8 w-8">
            <ProfileImg pubkey={pubkey} isLoading={isLoading} picture={profile?.picture} />
          </div>
        </div>
        <div className="flex h-full w-full flex-col gap-2">
          <div className="h-full w-3/5 rounded bg-stone-800" />
          <p>{displayName(pubkey, profile)}</p>
        </div>
      </div>
    </div>
  )
}

export default function IndexPage() {
  const { data: streams, isLoading, isError } = trpc.live.getLiveStreams.useQuery(undefined, { refetchInterval: 15000 })

  return (
    <div className="flex w-full flex-col overflow-y-auto px-8 py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {/* {isLoading && (
          <>
            {[...Array(32)].map((e, i) => (
              <DummyStreamCard key={i} />
            ))}
          </>
        )} */}
        {streams && (
          <>
            {streams.map((stream) => (
              <StreamCard pubkey={stream.publicKey} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
