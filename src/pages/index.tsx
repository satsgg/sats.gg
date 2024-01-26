import { useProfile } from '~/hooks/useProfile'
import { Stream, displayName, getStreamNaddr, getVerifiedChannelLink } from '~/utils/nostr'
import ProfileImg from '~/components/ProfileImg'
import Link from 'next/link'
import { Filter, nip19 } from 'nostr-tools'
import { useStreams } from '~/hooks/useStreams'
import { useEffect } from 'react'
import ThumbnailImg from '~/components/ThumbnailImg'
import { fmtNumber } from '~/utils/util'

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
  providerPubkey,
  d,
  title,
  image,
  relays,
  currentParticipants,
}: {
  pubkey: string
  providerPubkey?: string
  d: string
  title?: string
  image?: string
  relays?: string[]
  currentParticipants?: number
}) => {
  const { profile, isLoading } = useProfile(pubkey)

  if (isLoading) return <DummyStreamCard />

  const streamLink = getVerifiedChannelLink(profile) || getStreamNaddr(providerPubkey || pubkey, d, relays)

  return (
    <div className="flex flex-col gap-2">
      <Link href={`/${streamLink}`} legacyBehavior={false}>
        <div id="cardThumbnailWrapper" className="relative aspect-video">
          <ThumbnailImg pubkey={pubkey} thumbnail={image} />
          <div className="absolute top-0 m-2.5">
            <div className="rounded bg-red-600 px-1">
              <p className="text-sm font-semibold uppercase">live</p>
            </div>
          </div>

          {Number.isInteger(currentParticipants) && (
            <div className="absolute bottom-0 m-2.5">
              <div className="rounded bg-stone-900/80 px-1.5">
                <p className="text-sm">{fmtNumber(currentParticipants!, true)} viewers</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="flex h-16 w-full gap-2 ">
        <div className="">
          <div className="h-10 w-10">
            <Link href={`/${streamLink}`} legacyBehavior={false}>
              {isLoading ? (
                <div className="h-full w-full rounded-[50%] bg-gray-600" />
              ) : (
                <ProfileImg pubkey={pubkey} picture={profile?.picture} />
              )}
            </Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          {title && (
            <Link href={`/${streamLink}`} legacyBehavior={false}>
              <h3 className="truncate font-bold">{title}</h3>
            </Link>
          )}
          <Link href={`/${streamLink}`} legacyBehavior={false}>
            <p className="truncate">{!isLoading && displayName(pubkey, profile)}</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function IndexPage() {
  const streams = useStreams('streams-browse')
  console.debug('streams', streams)

  return (
    <div className="flex w-full flex-col overflow-y-auto px-8 py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {streams && (
          <>
            {streams
              .filter((stream) => stream.status === 'live')
              .map((stream) => (
                <StreamCard
                  key={stream.id}
                  pubkey={stream.pubkey}
                  providerPubkey={stream.providerPubkey}
                  d={stream.d}
                  title={stream.title}
                  image={stream.image}
                  relays={stream.relays}
                  currentParticipants={stream.currentParticipants}
                />
              ))}
          </>
        )}
      </div>
    </div>
  )
}
