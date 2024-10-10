import { useProfile } from '~/hooks/useProfile'
import { displayName, getStreamNaddr, getVerifiedChannelLink } from '~/utils/nostr'
import Link from 'next/link'
import { useStreams } from '~/hooks/useStreams'
import { fmtNumber } from '~/utils/util'
import { Eye } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'

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
  tags,
}: {
  pubkey: string
  providerPubkey?: string
  d: string
  title?: string
  image?: string
  relays?: string[]
  currentParticipants?: number
  tags?: string[]
}) => {
  const { profile, isLoading } = useProfile(pubkey)

  if (isLoading) return <DummyStreamCard />

  const streamLink = getVerifiedChannelLink(profile) || getStreamNaddr(providerPubkey || pubkey, d, relays)

  return (
    <div className="overflow-hidden rounded-lg bg-background shadow-sm">
      <Link href={`/${streamLink}`} legacyBehavior={false} className="group block">
        <div className="relative">
          <img
            src={image}
            alt={'stream thumbnail'}
            className="aspect-video h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
          <div className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            LIVE
          </div>
          {Number.isInteger(currentParticipants) && (
            <div className="absolute bottom-2 left-2 flex items-center rounded-full bg-black/75 px-2 py-1 text-xs text-white">
              <Eye className="mr-1 h-4 w-4" />
              {fmtNumber(currentParticipants!, true)}
            </div>
          )}
        </div>
      </Link>
      <div className="py-4">
        <div className="flex items-start space-x-3 px-3">
          <Link href={`/${streamLink}`} legacyBehavior={false}>
            <Avatar className="h-10 w-10 cursor-pointer transition-transform hover:scale-110">
              <AvatarImage src={profile?.picture} alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/${streamLink}`} legacyBehavior={false} className="block">
              <h3 className="truncate font-semibold leading-none transition-colors hover:text-primary-500">{title}</h3>
            </Link>
            <Link href={`/${streamLink}`} legacyBehavior={false} className="block">
              <p className="mt-1 truncate text-sm text-muted-foreground transition-colors hover:text-primary">
                {!isLoading && displayName(pubkey, profile)}
              </p>
            </Link>
            {tags && (
              <div className="flex overflow-hidden pt-2">
                {tags.slice(0, 3).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="mr-2 max-w-[33%] shrink-0 truncate px-2 py-0.5 text-xs last:mr-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // return (
  //   <div className="flex flex-col gap-2">
  //     <Link href={`/${streamLink}`} legacyBehavior={false}>
  //       <div id="cardThumbnailWrapper" className="relative aspect-video">
  //         <ThumbnailImg pubkey={pubkey} thumbnail={image} />
  //         <div className="absolute top-0 m-2.5">
  //           <div className="rounded bg-red-600 px-1">
  //             <p className="text-sm font-semibold uppercase">live</p>
  //           </div>
  //         </div>

  //         {Number.isInteger(currentParticipants) && (
  //           <div className="absolute bottom-0 m-2.5">
  //             <div className="rounded bg-stone-900/80 px-1.5">
  //               <p className="text-sm">{fmtNumber(currentParticipants!, true)} viewers</p>
  //             </div>
  //           </div>
  //         )}
  //       </div>
  //     </Link>

  //     <div className="flex h-16 w-full gap-2 ">
  //       <div className="">
  //         <div className="h-10 w-10">
  //           <Link href={`/${streamLink}`} legacyBehavior={false}>
  //             {isLoading ? (
  //               <div className="h-full w-full rounded-[50%] bg-gray-600" />
  //             ) : (
  //               <ProfileImg pubkey={pubkey} picture={profile?.picture} />
  //             )}
  //           </Link>
  //         </div>
  //       </div>
  //       <div className="flex min-w-0 flex-col">
  //         {title && (
  //           <Link href={`/${streamLink}`} legacyBehavior={false}>
  //             <h3 className="truncate font-bold">{title}</h3>
  //           </Link>
  //         )}
  //         <Link href={`/${streamLink}`} legacyBehavior={false}>
  //           <p className="truncate">{!isLoading && displayName(pubkey, profile)}</p>
  //         </Link>
  //       </div>
  //     </div>
  //   </div>
  // )
}

export default function IndexPage() {
  const streams = useStreams('streams-browse')
  // console.debug('streams', streams)

  // TODO:
  // - sort by currentParticipants?
  // stop reordering as much
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Live Streams</h1>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              tags={stream.t}
            />
          ))}
      </div>
    </div>
  )

  // return (
  //   <div className="flex w-full flex-col overflow-y-auto px-8 py-6">
  //     <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
  //       {streams && (
  //         <>
  //           {streams
  //             .filter((stream) => stream.status === 'live')
  //             .map((stream) => (
  //               <StreamCard
  //                 key={stream.id}
  //                 pubkey={stream.pubkey}
  //                 providerPubkey={stream.providerPubkey}
  //                 d={stream.d}
  //                 title={stream.title}
  //                 image={stream.image}
  //                 relays={stream.relays}
  //                 currentParticipants={stream.currentParticipants}
  //               />
  //             ))}
  //         </>
  //       )}
  //     </div>
  //   </div>
  // )
}
