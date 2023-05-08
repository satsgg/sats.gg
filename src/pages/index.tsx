import { useProfile } from '~/hooks/useProfile'
import { trpc } from '~/utils/trpc'
import { displayName } from '~/utils/nostr'
import ProfileImg from '~/components/ProfileImg'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

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

const StreamCard = ({
  pubkey,
  playbackId,
  streamTitle,
}: {
  pubkey: string
  playbackId: string
  streamTitle: string | null
}) => {
  const { profile, isLoading } = useProfile(pubkey)

  const {
    isLoading: thumbnailIsLoading,
    error: thumbnailError,
    data: thumbnailData,
  } = useQuery({
    queryKey: ['thumbnail'],
    queryFn: async () => {
      const response = await fetch(`https://image.mux.com/${playbackId}/thumbnail.jpg?height=347`)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const imageBlob = await response.blob()
      return URL.createObjectURL(imageBlob)
    },
  })

  if (isLoading) return <DummyStreamCard />

  return (
    <div className="flex flex-col gap-2">
      <Link className="aspect-video h-full w-full" href={`/${pubkey}`} legacyBehavior={false}>
        {thumbnailIsLoading ? (
          <div className="aspect-video h-full w-full rounded bg-stone-800"></div>
        ) : (
          <img className="h-full w-full" src={thumbnailData} alt={`thumbnail of ${pubkey}`} />
        )}
      </Link>

      <div className="flex h-16 w-full gap-2 ">
        <div className="">
          <div className="h-10 w-10">
            <Link href={`/${pubkey}`} legacyBehavior={false}>
              {isLoading ? (
                <div className="h-full w-full rounded-[50%] bg-gray-600" />
              ) : (
                <ProfileImg pubkey={pubkey} picture={profile?.picture} />
              )}
            </Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          {streamTitle && (
            <Link href={`/${pubkey}`} legacyBehavior={false}>
              <h3 className="truncate font-bold">{streamTitle}</h3>
            </Link>
          )}
          <Link href={`/${pubkey}`} legacyBehavior={false}>
            <p className="truncate">{!isLoading && displayName(pubkey, profile)}</p>
          </Link>
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
        {streams && (
          <>
            {streams.map((stream) => (
              <StreamCard pubkey={stream.publicKey} playbackId={stream.playbackId} streamTitle={stream.streamTitle} />
            ))}
          </>
        )}
        {/* <StreamCard
          pubkey={'5b6bfd0b8b1b2107e247d1750519ef30c142d5e6da8503cd28293ee22446c43b'}
          playbackId="123"
          streamTitle="yoooooooooooookjashflkjasdhfljhaskljfhasdjkhfljaksdhflkjasdhfkjh"
        /> */}
        {/* {isLoading && (
          <>
            {[...Array(32)].map((e, i) => (
              <DummyStreamCard key={i} />
            ))}
          </>
        )} */}
      </div>

      {!isLoading && streams?.length === 0 && (
        <>
          <p>Welcome to sats.gg!</p>
          <p>Nobody is streaming at the moment... Be the first!</p>
        </>
      )}
    </div>
  )
}
