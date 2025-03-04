import { useState } from 'react'
import Link from 'next/link'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useProfile } from '~/hooks/useProfile'
import useAuthStore from '~/hooks/useAuthStore'
import { getVerifiedChannelLink } from '~/utils/nostr'
import { Button } from '@/components/ui/button'
import { ModeToggle } from './ThemeModeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Video, Wifi, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import GoLiveModal from './GoLiveModal'
// import { useTheme } from 'next-themes'

interface HeaderProps {
  openAuthenticate: () => void
  openGoLive: () => void
}

export const Navbar = ({ openAuthenticate, openGoLive }: HeaderProps) => {
  // const { theme } = useTheme()
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const relays = useSettingsStore((state) => state.relays)
  const [user, pubkey, npub, view, logout] = useAuthStore((state) => [
    state.user,
    state.pubkey,
    state.npub,
    state.view,
    state.logout,
  ])
  const { profile, isLoading } = useProfile(pubkey)
  const connectedRelays = useConnectedRelays()

  const handleLogout = async () => {
    setShowAccountMenu(false)
    logout()
  }

  return (
    <nav className="flex items-center justify-between bg-background px-4 py-3 shadow-sm">
      <Link href="/" className="">
        <h1 className="cursor-pointer text-2xl font-bold text-primary hover:text-primary/80">
          {/* TODO: Something wrong here when refreshing on light mode */}
          {/* {theme === 'light' ? '💯' : '🤘'} SATS.GG */}
          🤘 SATS.GG
        </h1>
      </Link>
      <div className="flex items-center space-x-4">
        <ModeToggle />

        {/* Relays */}
        {/* TODO: Add dialog to add/remove relays instead of going to settings? */}
        <Link href={'/settings/relays'}>
          <Button variant="outline" size="sm" className="text-primary">
            <Wifi className="mr-2 h-4 w-4" />
            <a>
              {connectedRelays.size}/{relays.length}
            </a>
          </Button>
        </Link>

        {/* Go Live */}
        {/* {view === 'authenticated' && (
          <Button variant="outline" size="sm" className="text-primary">
            <Video className="mr-2 h-4 w-4" />
            Go Live
          </Button>
        )} */}

        {view === 'authenticated' && <GoLiveModal />}

        {view === 'authenticated' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.picture} alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {profile?.name ? profile.name.slice(0, 12) : npub?.slice(0, 12)}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href={`/${getVerifiedChannelLink(profile) || npub}`}
                  legacyBehavior={false}
                  className="flex items-center"
                >
                  <Video className="mr-2 h-4 w-4" />
                  <span>My Channel</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard" legacyBehavior={false} className="flex  items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings/profile" legacyBehavior={false} className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="flex cursor-pointer items-center text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={openAuthenticate}>
            Login
          </Button>
        )}
      </div>
    </nav>
  )
  // return (
  //   <nav className="flex w-full items-center justify-between bg-stone-900 py-1 text-gray-200 shadow-lg sm:py-2">
  //     <div className="flex w-full items-center justify-between px-2 sm:px-6">
  //       <Link href="/">
  //         <a>
  //           <h1 className="select-none text-2xl font-bold text-white hover:cursor-pointer">SATS.GG</h1>
  //         </a>
  //       </Link>

  //       <div className="flex items-center gap-4">
  //         {view && (
  //           <Link href={'/settings/relays'} legacyBehavior={false}>
  //             {connectedRelays.size}/{relays.length}
  //           </Link>
  //         )}
  //         {view === 'authenticated' && <Button onClick={openGoLive}>Go Live</Button>}
  //         {(view === 'pubkey' || view === 'authenticated') && (
  //           <ClickAwayListener onClickAway={() => setShowAccountMenu(false)}>
  //             <div className="dropdown relative">
  //               <a
  //                 className="dropdown-toggle hidden-arrow flex items-center"
  //                 id="dropdownAccountButton"
  //                 role="button"
  //                 data-bs-toggle="dropdown"
  //                 aria-expanded="false"
  //                 onClick={() => setShowAccountMenu((showAccountMenu) => !showAccountMenu)}
  //               >
  //                 <AccountSVG width={32} height={32} />
  //               </a>
  //               {showAccountMenu && (
  //                 <ul
  //                   className={
  //                     'absolute left-auto right-0 z-50 float-left m-0 mt-1 w-56 min-w-max list-none rounded-lg border-none bg-stone-900 bg-clip-padding py-2 px-2 text-left text-base shadow-lg'
  //                   }
  //                   aria-labelledby="dropdownAccountButton"
  //                   id="dropdown-menu"
  //                 >
  //                   <li>
  //                     <div className="inline-flex items-center py-2 px-1">
  //                       <Link href="/settings/profile" legacyBehavior={false} onClick={() => setShowAccountMenu(false)}>
  //                         {profile && profile.picture ? (
  //                           <img
  //                             className="mr-2 h-10 w-10 rounded-[50%] hover:cursor-pointer"
  //                             src={profile.picture}
  //                             alt={`profile image of ${npub}`}
  //                           />
  //                         ) : (
  //                           <div className="mr-2 h-10 w-10 rounded-[50%] border border-gray-500"></div>
  //                         )}
  //                       </Link>
  //                       {profile && profile.name ? (
  //                         <span className="text-sm font-semibold">{profile.name.slice(0, 12)}</span>
  //                       ) : (
  //                         <span className="text-sm font-semibold">{npub!.slice(0, 12)}...</span>
  //                       )}
  //                     </div>
  //                   </li>
  //                   <hr className="my-2 rounded border-t border-gray-500"></hr>
  //                   <li>
  //                     {/* TODO: link won't work for naddr here... */}
  //                     <Link
  //                       href={`/${getVerifiedChannelLink(profile) || npub}`}
  //                       legacyBehavior={false}
  //                       onClick={() => setShowAccountMenu(false)}
  //                       className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
  //                     >
  //                       <ChannelSVG width={20} height={20} className="mr-1" strokeWidth={1.5} />
  //                       <span className="select-none">My Channel</span>
  //                     </Link>
  //                   </li>
  //                   {/* <li>
  //                     <Link
  //                       href={`/notifications?pubkey=${pubkey}${
  //                         user?.chatChannelId ? `&id=${user.chatChannelId}` : ''
  //                       }`}
  //                       legacyBehavior={false}
  //                       onClick={() => setShowAccountMenu(false)}
  //                       className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
  //                     >
  //                       <Notifications width={20} height={20} className="mr-1" strokeWidth={1.5} />
  //                       <span>Notifications</span>
  //                     </Link>
  //                   </li> */}
  //                   <li>
  //                     <Link
  //                       href="/settings/profile"
  //                       legacyBehavior={false}
  //                       onClick={() => setShowAccountMenu(false)}
  //                       className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
  //                     >
  //                       <SettingsSVG width={20} height={20} className="mr-1" strokeWidth={1.5} />
  //                       <span className="select-none">Settings</span>
  //                     </Link>
  //                   </li>
  //                   <hr className="my-2 rounded border-t border-gray-500"></hr>
  //                   <li>
  //                     <Link href="/">
  //                       <a
  //                         className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
  //                         onClick={handleLogout}
  //                       >
  //                         <LogOutSVG width={20} height={20} className="mr-1" strokeWidth={1.5} />
  //                         <span className="select-none">Log Out</span>
  //                       </a>
  //                     </Link>
  //                   </li>
  //                 </ul>
  //               )}
  //             </div>
  //           </ClickAwayListener>
  //         )}
  //         {view === 'default' && (
  //           <Button
  //             className="hidden sm:inline-flex"
  //             onClick={openAuthenticate}
  //             icon={<Key height={20} width={20} strokeWidth={1.5} />}
  //           >
  //             <span>Log In</span>
  //           </Button>
  //         )}
  //       </div>
  //     </div>
  //   </nav>
  // )
}
