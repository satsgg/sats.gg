import Link from 'next/link'
import { useProfile } from '~/hooks/useProfile'
import { nip19 } from 'nostr-tools'
import { Stream, displayName, getStreamNaddr, getVerifiedChannelLink } from '~/utils/nostr'
import { fmtNumber } from '~/utils/util'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/router'

export const FollowedChannelSingle = ({
  pubkey,
  stream,
  userCollapse,
  autoCollapse,
}: {
  pubkey: string
  stream: Stream | null
  userCollapse: boolean
  autoCollapse: boolean
}) => {
  const router = useRouter()
  const { profile, isLoading } = useProfile(pubkey)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)

  const streamLink =
    // getVerifiedChannelLink(profile) ||
    stream ? getStreamNaddr(stream.providerPubkey || stream.pubkey, stream.d, stream.relays) : nip19.npubEncode(pubkey)

  return (
    // <Popover key={profile?.name}>
    <Popover
      key={pubkey}
      open={userCollapse && openPopoverId === pubkey}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setOpenPopoverId(pubkey)
        } else {
          setOpenPopoverId(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        {/* <Link href={`/${streamLink}`}> */}
        <Button
          variant="ghost"
          className={`mb-1 w-full justify-start ${userCollapse ? 'px-1 py-1' : 'px-2 py-1.5'} h-10`}
          onClick={() => router.push(`/watch/${streamLink}`)}
          onMouseEnter={() => userCollapse && setOpenPopoverId(pubkey)}
          onMouseLeave={() => userCollapse && setOpenPopoverId(null)}
        >
          <div className="flex w-full items-center space-x-2">
            {/* <div className="flex w-full items-center space-x-2 overflow-hidden"> */}
            <Avatar className={`${userCollapse ? 'h-8 w-8' : 'h-7 w-7'} flex-shrink-0`}>
              <AvatarImage src={profile?.picture} alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            {!userCollapse && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium leading-none">
                    {!isLoading && displayName(pubkey, profile)}
                  </p>
                  {stream?.status === 'live' && (
                    <p className="truncate text-xs text-muted-foreground">{stream?.title}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center space-x-1">
                  {stream?.status === 'live' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                  )}
                  {stream?.status === 'live' && Number.isInteger(stream?.currentParticipants) && (
                    <span className="text-xs text-muted-foreground">
                      {fmtNumber(stream?.currentParticipants!, true)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </Button>
        {/* </Link> */}
      </PopoverTrigger>
      {userCollapse && (
        <PopoverContent side="right" className="w-56 p-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{!isLoading && displayName(pubkey, profile)}</h3>
              <div className="flex items-center space-x-1">
                {stream && stream.status === 'live' && (
                  <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                )}
                {Number.isInteger(stream?.currentParticipants) && (
                  <span className="text-xs text-muted-foreground">{fmtNumber(stream?.currentParticipants!, true)}</span>
                )}
              </div>
            </div>
            <p className="text-xs">{stream?.title}</p>
            <p className="text-xs text-muted-foreground">{stream?.summary}</p>
          </div>
        </PopoverContent>
        // <PopoverContent side="right" className="w-64 p-4">
        //   <div className="space-y-2">
        //     <h3 className="font-semibold">{!isLoading && displayName(pubkey, profile)}</h3>
        //     <p className="text-sm">{stream?.title}</p>
        //     <p className="text-xs text-muted-foreground">{stream?.summary}</p>
        //     <div className="flex items-center justify-between">
        //       <span className="text-xs font-medium">
        //         {stream && stream.status === 'live' ? (
        //           <span className="text-red-500">● Live</span>
        //         ) : (
        //           <span className="text-muted-foreground">Offline</span>
        //         )}
        //       </span>
        //       {Number.isInteger(stream?.currentParticipants) && (
        //         <span className="text-xs text-muted-foreground">{fmtNumber(stream?.currentParticipants!, true)}</span>
        //       )}
        //     </div>
        //   </div>
        // </PopoverContent>
      )}
    </Popover>
  )
  // return (
  //   <Link href={`/${streamLink}`}>
  //     <a>
  //       <div className="flex justify-between gap-2 py-2 px-2 hover:cursor-pointer hover:bg-stone-700/25">
  //         <div className="flex min-w-0">
  //           <div className={`${userCollapse ? '' : 'mr-2'} h-8 w-8 shrink-0`}>
  //             {isLoading ? (
  //               <div className="h-full w-full rounded-[50%] bg-gray-600" />
  //             ) : (
  //               <ProfileImg pubkey={pubkey} picture={profile?.picture} />
  //             )}
  //           </div>

  //           <div className={`${userCollapse || autoCollapse ? 'hidden' : 'flex flex-col'} min-w-0`}>
  //             <p className="select-none truncate text-sm font-semibold text-white">
  //               {!isLoading && displayName(pubkey, profile)}
  //             </p>
  //             {/* TODO: tags */}
  //           </div>
  //         </div>

  //         <div className={`${userCollapse || autoCollapse ? 'hidden' : 'align-right'}`}>
  //           {stream && stream.status === 'live' ? (
  //             <span className="inline-flex gap-1">
  //               <LiveSVG width={20} height={20} className="fill-red-600" />
  //               {Number.isInteger(stream.currentParticipants) && (
  //                 <span className="text-sm text-gray-100">{fmtNumber(stream.currentParticipants!, true)}</span>
  //               )}
  //             </span>
  //           ) : (
  //             <p className="text-sm font-light text-white">Offline</p>
  //           )}
  //         </div>
  //       </div>
  //     </a>
  //   </Link>
  // )
}
