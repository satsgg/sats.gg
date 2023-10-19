import { useProfile } from '~/hooks/useProfile'
import { displayName, getStreamNaddr, getVerifiedChannelLink } from '~/utils/nostr'
import ProfileImg from '~/components/ProfileImg'
import Link from 'next/link'
import { fmtViewerCnt } from '~/utils/util'
import { Filter, nip19 } from 'nostr-tools'
import { useStreams } from '~/hooks/useStreams'
import { useEffect } from 'react'
import { naddrEncode } from 'nostr-tools/lib/nip19'

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
  identifier,
  streamTitle,
  thumbnail,
  relays,
}: {
  pubkey: string
  identifier?: string
  streamTitle?: string
  thumbnail?: string
  relays?: string[]
}) => {
  const { profile, isLoading } = useProfile(pubkey)

  if (isLoading) return <DummyStreamCard />

  return (
    <div className="flex flex-col gap-2">
      {/* <Link href={getVerifiedChannelLink(profile) || `/${nip19.npubEncode(pubkey)}`} legacyBehavior={false}> */}
      <Link href={`/${getStreamNaddr(pubkey, identifier, relays)}`} legacyBehavior={false}>
        <div id="cardThumbnailWrapper" className="relative aspect-video">
          {thumbnail ? (
            <img className="h-full w-full" src={thumbnail} alt={`thumbnail of ${pubkey}`} />
          ) : (
            <div className="h-full w-full rounded bg-stone-800"></div>
          )}
          <div className="absolute top-0 m-2.5">
            <div className="rounded bg-red-600 px-1">
              <p className="text-sm font-semibold uppercase">live</p>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex h-16 w-full gap-2 ">
        <div className="">
          <div className="h-10 w-10">
            <Link href={getVerifiedChannelLink(profile) || `/${nip19.npubEncode(pubkey)}`} legacyBehavior={false}>
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
            <Link href={getVerifiedChannelLink(profile) || `/${nip19.npubEncode(pubkey)}`} legacyBehavior={false}>
              <h3 className="truncate font-bold">{streamTitle}</h3>
            </Link>
          )}
          <Link href={getVerifiedChannelLink(profile) || `/${nip19.npubEncode(pubkey)}`} legacyBehavior={false}>
            <p className="truncate">{!isLoading && displayName(pubkey, profile)}</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function IndexPage() {
  const filters: Filter[] = [
    {
      kinds: [30311],
      // since: Math.floor(Date.now() / 1000) - 3600,
      // '#status': ['live'],
    },
  ]
  const streams = useStreams('streams', filters)

  useEffect(() => {
    console.log('streams', streams)
  }, [streams])

  return (
    <div className="flex w-full flex-col overflow-y-auto px-8 py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {streams && (
          <>
            {streams.map((stream) => (
              <StreamCard
                key={stream.pubkey}
                pubkey={stream.pubkey}
                identifier={stream.d}
                streamTitle={stream.title}
                thumbnail={stream.image}
                relays={stream.relays}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
