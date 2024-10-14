import useFollows from '~/hooks/useFollows'
import useAuthStore from '~/hooks/useAuthStore'
import { FollowedChannelSingle } from './FollowedChannelSingle'
import { useStreams } from '~/hooks/useStreams'
import { Stream } from '~/utils/nostr'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowRightFromLine, ArrowLeftFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'

export const FollowedChannelList = ({
  autoCollapse,
  userCollapse,
  setUserCollapse,
}: {
  autoCollapse: boolean
  userCollapse: boolean
  setUserCollapse: Function
}) => {
  const pubkey = useAuthStore((state) => state.pubkey)
  const follows = useFollows(pubkey)
  // const streams = useStreams('streams-followed', follows.follows, false, follows.follows.length)
  // TODO: fix zap stream pubkey again
  const streams = useStreams(
    'streams-followed',
    [...follows.follows, 'cf45a6ba1363ad7ed213a078e710d24115ae721c9b47bd1ebf4458eaefb4c2a5'],
    false,
  )

  const liveFollows = useMemo(() => {
    console.debug('running liveFollows')
    const streamMap = new Map(streams.map((stream) => [stream.pubkey, stream]))

    return follows.follows
      .map((pubkey) => ({
        pubkey,
        stream: streamMap.get(pubkey) || null,
      }))
      .sort((a, b) => {
        // First, sort by live status
        if (a.stream?.status === 'live' && b.stream?.status !== 'live') return -1
        if (a.stream?.status !== 'live' && b.stream?.status === 'live') return 1

        // If both are live, sort by viewer count (if available)
        if (a.stream?.status === 'live' && b.stream?.status === 'live') {
          const aViewers = a.stream.currentParticipants || 0
          const bViewers = b.stream.currentParticipants || 0
          return bViewers - aViewers // Sort in descending order
        }

        return 0
      })
  }, [follows.follows, streams])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className={`${userCollapse ? 'w-12' : 'w-60'} flex flex-col border-r border-border bg-background`}>
        <div className={`flex items-center p-2 ${userCollapse ? 'justify-center' : 'justify-between'}`}>
          {!userCollapse && <h2 className="text-md font-semibold">Followed Channels</h2>}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setUserCollapse(!userCollapse)}
            aria-label={userCollapse ? 'Expand followed channels' : 'Collapse followed channels'}
          >
            {userCollapse ? <ArrowRightFromLine className="h-4 w-4" /> : <ArrowLeftFromLine className="h-4 w-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <div className={`${userCollapse ? 'px-1' : 'px-1'} pb-2`}>
            {liveFollows.map((user, index) => (
              <FollowedChannelSingle
                key={index}
                pubkey={user.pubkey}
                stream={user.stream}
                userCollapse={userCollapse}
                autoCollapse={autoCollapse}
              />
              // <Popover key={channel.name}>
              //   <PopoverTrigger asChild>
              //     <Button
              //       variant="ghost"
              //       className={`mb-2 w-full justify-start p-2 ${userCollapse ? 'h-auto' : 'h-12'}`}
              //       onClick={() => console.log(`Navigating to ${channel.name}'s stream`)}
              //     >
              //       <div className="flex w-full items-center space-x-2">
              //         <Avatar className="h-8 w-8 flex-shrink-0">
              //           <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={channel.name} />
              //           <AvatarFallback>{channel.name.slice(0, 2)}</AvatarFallback>
              //         </Avatar>
              //         {!userCollapse && (
              //           <>
              //             <div className="min-w-0 flex-1 text-left">
              //               <p className="truncate text-sm font-medium leading-none">{channel.name}</p>
              //               <p className="truncate text-xs text-muted-foreground">{channel.title}</p>
              //             </div>
              //             <div className="flex items-center space-x-1">
              //               {channel.isLive && <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />}
              //               <span className="text-xs text-muted-foreground">{channel.viewers}</span>
              //             </div>
              //           </>
              //         )}
              //       </div>
              //     </Button>
              //   </PopoverTrigger>
              //   {userCollapse && (
              //     <PopoverContent side="right" className="w-64 p-4">
              //       <div className="space-y-2">
              //         <h3 className="font-semibold">{channel.name}</h3>
              //         <p className="text-sm">{channel.title}</p>
              //         <p className="text-xs text-muted-foreground">{channel.description}</p>
              //         <div className="flex items-center justify-between">
              //           <span className="text-xs font-medium">
              //             {channel.isLive ? (
              //               <span className="text-red-500">● Live</span>
              //             ) : (
              //               <span className="text-muted-foreground">Offline</span>
              //             )}
              //           </span>
              //           <span className="text-xs text-muted-foreground">{channel.viewers} viewers</span>
              //         </div>
              //       </div>
              //     </PopoverContent>
              //   )}
              // </Popover>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )

  // return (
  //   <div className="w-64 border-r border-border">
  //     <ScrollArea className="h-full">
  //       <div className="p-4">
  //         <h2 className="mb-2 text-lg font-semibold">Followed Channels</h2>
  //         {liveFollows().map((channel) => (
  //           <div key={channel.name} className="mb-2 flex items-center space-x-2">
  //             <Avatar className="h-8 w-8 flex-shrink-0">
  //               <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={channel.name} />
  //               <AvatarFallback>{channel.name.slice(0, 2)}</AvatarFallback>
  //             </Avatar>
  //             <div className="min-w-0 flex-1">
  //               <p className="truncate text-sm font-medium leading-none">{channel.name}</p>
  //               <p className="truncate text-xs text-muted-foreground">{channel.title}</p>
  //             </div>
  //             <div className="flex items-center space-x-1">
  //               {channel.stream && channel.stream.status === 'live' && (
  //                 <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
  //               )}
  //               <span className="text-xs text-muted-foreground">{channel.viewers}</span>
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </ScrollArea>
  //   </div>
  // )

  // return (
  //   <>
  //     <div
  //       className={`
  //         ${autoCollapse ? 'hidden' : ''}
  //         ${userCollapse ? 'justify-center' : 'justify-between'}
  //         flex shrink-0 p-2`}
  //     >
  //       <div className="flex flex-col justify-center">
  //         <p className={`${userCollapse ? 'hidden' : ''} align-middle text-sm uppercase text-white`}>
  //           followed channels
  //         </p>
  //       </div>
  //       <button onClick={() => setUserCollapse(!userCollapse)}>
  //         {userCollapse ? (
  //           <OpenRightSVG width={24} height={24} strokeWidth={2} className="stroke-white" />
  //         ) : (
  //           <OpenLeftSVG width={24} height={24} strokeWidth={2} className="stroke-white" />
  //         )}
  //       </button>
  //     </div>
  //     <Virtuoso
  //       data={liveFollows()}
  //       className="no-scrollbar"
  //       itemContent={(index, user) => {
  //         return (
  //           <FollowedChannelSingle
  //             key={index}
  //             pubkey={user.pubkey}
  //             stream={user.stream}
  //             userCollapse={userCollapse}
  //             autoCollapse={autoCollapse}
  //           />
  //         )
  //       }}
  //     />
  //   </>
  // )
}
