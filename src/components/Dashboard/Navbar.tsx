import Link from 'next/link'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useProfile } from '~/hooks/useProfile'
import useAuthStore from '~/hooks/useAuthStore'
import { ModeToggle } from '@/components/ThemeModeToggle'
import { Button } from '@/components/ui/button'
import { Menu, Wifi } from 'lucide-react'

export const Navbar = () => {
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

  return (
    <nav className="flex items-center justify-between bg-background px-4 py-3 shadow-sm">
      <div className="flex items-center">
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="ml-4 text-xl font-bold">Dashboard</h1>
      </div>

      <div className="flex items-center space-x-4">
        <ModeToggle />

        {/* Relays */}
        <Link href={'/settings/relays'}>
          <Button variant="outline" size="sm" className="text-primary">
            <Wifi className="mr-2 h-4 w-4" />
            <a>
              {connectedRelays.size}/{relays.length}
            </a>
          </Button>
        </Link>
      </div>
    </nav>
  )
}
