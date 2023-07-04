import { useState } from 'react'
import ClickAwayListener from 'react-click-away-listener'
import Link from 'next/link'
import ChannelSVG from '~/svgs/my-channel.svg'
import LogOutSVG from '~/svgs/log-out.svg'
import Key from '~/svgs/key.svg'
import SettingsSVG from '~/svgs/settings.svg'
import Notifications from '~/svgs/notifications.svg'
import AccountSVG from '~/svgs/account.svg'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useProfile } from '~/hooks/useProfile'
import useAuthStore from '~/hooks/useAuthStore'
import Button from './Button'
import { getVerifiedChannelLink } from '~/utils/nostr'

interface HeaderProps {
  openAuthenticate: () => void
}

export const Navbar = ({ openAuthenticate }: HeaderProps) => {
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
    <nav className="flex w-full items-center justify-between bg-stone-900 py-1 text-gray-200 shadow-lg sm:py-2">
      <div className="flex w-full items-center justify-between px-2 sm:px-6">
        <Link href="/">
          <h1 className="text-2xl font-bold text-white hover:cursor-pointer">SATS.GG</h1>
        </Link>

        <div className="flex items-center gap-4">
          {view && (
            <Link href={'/settings/relays'} legacyBehavior={false}>
              {connectedRelays.size}/{relays.length}
            </Link>
          )}
          {(view === 'pubkey' || view === 'authenticated') && (
            <ClickAwayListener onClickAway={() => setShowAccountMenu(false)}>
              <div className="dropdown relative">
                <a
                  className="dropdown-toggle hidden-arrow flex items-center"
                  id="dropdownAccountButton"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={() => setShowAccountMenu((showAccountMenu) => !showAccountMenu)}
                >
                  <AccountSVG width={32} height={32} />
                </a>
                {showAccountMenu && (
                  <ul
                    className={
                      'absolute left-auto right-0 z-50 float-left m-0 mt-1 w-56 min-w-max list-none rounded-lg border-none bg-stone-900 bg-clip-padding py-2 px-2 text-left text-base shadow-lg'
                    }
                    aria-labelledby="dropdownAccountButton"
                    id="dropdown-menu"
                  >
                    <li>
                      <div className="inline-flex items-center py-2 px-1">
                        <Link href="/settings/profile" legacyBehavior={false} onClick={() => setShowAccountMenu(false)}>
                          {profile && profile.picture ? (
                            <img
                              className="mr-2 h-10 w-10 rounded-[50%] hover:cursor-pointer"
                              src={profile.picture}
                              alt={`profile image of ${npub}`}
                            />
                          ) : (
                            <div className="mr-2 h-10 w-10 rounded-[50%] border border-gray-500"></div>
                          )}
                        </Link>
                        {profile && profile.name ? (
                          <span className="text-sm font-semibold">{profile.name.slice(0, 12)}</span>
                        ) : (
                          <span className="text-sm font-semibold">{npub!.slice(0, 12)}...</span>
                        )}
                      </div>
                    </li>
                    <hr className="my-2 rounded border-t border-gray-500"></hr>
                    <li>
                      <Link
                        href={getVerifiedChannelLink(profile) || `/${npub}`}
                        legacyBehavior={false}
                        onClick={() => setShowAccountMenu(false)}
                        className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
                      >
                        <ChannelSVG width={20} height={20} className="mr-1" strokeWidth={1.5} />
                        <span>My Channel</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={`/notifications?pubkey=${pubkey}${
                          user?.chatChannelId ? `&id=${user.chatChannelId}` : ''
                        }`}
                        legacyBehavior={false}
                        onClick={() => setShowAccountMenu(false)}
                        className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
                      >
                        <Notifications width={20} height={20} className="mr-1" strokeWidth={1.5} />
                        <span>Notifications</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/settings/profile"
                        legacyBehavior={false}
                        onClick={() => setShowAccountMenu(false)}
                        className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
                      >
                        <SettingsSVG width={20} height={20} className="mr-1" strokeWidth={1.5} />
                        <span>Settings</span>
                      </Link>
                    </li>
                    <hr className="my-2 rounded border-t border-gray-500"></hr>
                    <li>
                      <Link href="/">
                        <a
                          className="inline-flex w-full whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
                          onClick={handleLogout}
                        >
                          <LogOutSVG width={20} height={20} className="mr-1" strokeWidth={1.5} />
                          <span>Log Out</span>
                        </a>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            </ClickAwayListener>
          )}
          {view === 'default' && (
            <Button
              className="hidden sm:inline-flex"
              onClick={openAuthenticate}
              icon={<Key height={20} width={20} strokeWidth={1.5} />}
            >
              <span>Log In</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
