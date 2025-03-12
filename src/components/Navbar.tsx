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
import { useRouter } from 'next/router'
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
  const router = useRouter()

  const handleLogout = async () => {
    setShowAccountMenu(false)
    logout()
  }

  return (
    <nav className="flex items-center justify-between bg-background px-4 py-3 shadow-sm">
      <Link href="/watch" className="">
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

        {view === 'authenticated' && router.pathname !== '/' && (
          <GoLiveModal
            childButton={
              <Button variant="outline" size="sm" className="text-primary">
                <Video className="mr-2 h-4 w-4" />
                Go Live
              </Button>
            }
          />
        )}

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
                  // href={`/${getVerifiedChannelLink(profile) || npub}`}
                  href={`/watch/${npub}`}
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
}
