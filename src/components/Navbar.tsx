import { useState } from 'react'
import ClickAwayListener from 'react-click-away-listener'
import Link from 'next/link'
import ChannelSVG from '~/svgs/my-channel.svg'
import LogOutSVG from '~/svgs/log-out.svg'
import LogInSVG from '~/svgs/log-in.svg'
import SettingsSVG from '~/svgs/settings.svg'
import AccountSVG from '~/svgs/account.svg'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useProfile } from '~/hooks/useProfile'
import useAuthStore from '~/hooks/useAuthStore'

interface HeaderProps {
  openAuthenticate: () => void
}

export const Navbar = ({ openAuthenticate }: HeaderProps) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const { relays } = useSettingsStore()
  const [pubkey, npub, logout] = useAuthStore((state) => [state.pubkey, state.npub, state.logout])
  const { profile, isLoading } = useProfile(pubkey)
  const connectedRelays = useConnectedRelays()

  const handleLogout = async () => {
    setShowAccountMenu(false)
    logout()
  }

  return (
    <nav className="flex w-full items-center justify-between bg-stone-900 py-2 text-gray-200 shadow-lg">
      <div className="flex w-full items-center justify-between px-6">
        <Link href="/">
          <h1 className="text-2xl font-bold text-white hover:cursor-pointer">SATS.GG</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Link href={'/settings/relays'} legacyBehavior={false}>
            {connectedRelays.size}/{relays.length}
          </Link>
          {pubkey && (
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
                  <AccountSVG width={34} height={34} />
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
                        href={`/${npub}`}
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
          {!pubkey && (
            <button
              type="button"
              onClick={openAuthenticate}
              className="font-semi inline-flex items-center rounded bg-primary px-3 py-2 text-sm uppercase text-black shadow-md transition duration-150 ease-in-out hover:bg-primary/80 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
            >
              <LogInSVG width={20} height={20} className="mr-1.5 h-4" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
