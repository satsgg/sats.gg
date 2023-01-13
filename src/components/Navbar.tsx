import useAuthStore from '~/store/useAuthStore'
import { useState } from 'react'
import ClickAwayListener from 'react-click-away-listener'
import Link from 'next/link'
import { trpc } from '~/utils/trpc'
import ChannelSVG from '~/svgs/my-channel.svg'
import LogOutSVG from '~/svgs/log-out.svg'
import LogInSVG from '~/svgs/log-in.svg'
import SettingsSVG from '~/svgs/settings.svg'
import WalletSVG from '~/svgs/wallet.svg'
import LightningBoltSVG from '~/svgs/lightning-bolt.svg'
import EyeVisibleSVG from '~/svgs/eye-visible.svg'
import EyeHiddenSVG from '~/svgs/eye-hidden.svg'
import AccountSVG from '~/svgs/account.svg'

interface HeaderProps {
  openAuthenticate: () => void
  openTransact: () => void
}

export const Navbar = ({ openAuthenticate, openTransact }: HeaderProps) => {
  const { user, status: authStatus, logout, showBalance, setShowBalance } = useAuthStore()
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const { data: myBalance } = trpc.accounting.myBalance.useQuery(undefined, {
    enabled: !!user?.id,
  })

  const utils = trpc.useContext()

  const handleLogout = async () => {
    await utils.invalidate()
    setShowAccountMenu(false)
    logout()
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light relative flex w-full flex-wrap items-center justify-between bg-stone-900 py-2 text-gray-200 shadow-lg">
      <div className="container-fluid flex w-full flex-wrap items-center justify-between px-6">
        <div className="container-fluid">
          <Link href="/">
            <span className="text-2xl font-bold text-white hover:cursor-pointer">SATS.GG</span>
          </Link>
        </div>
        {user && (
          <div className="relative flex items-center gap-4">
            <div className="inline-flex items-center">
              <div className="inline-flex items-center rounded-lg border px-2 py-1 text-sm">
                <span className="inline-flex items-center hover:cursor-pointer" onClick={openTransact}>
                  <LightningBoltSVG width={20} height={20} className="mr-1 text-primary" />
                  <span className="w-11">{showBalance ? myBalance : '*******'}</span>
                </span>
                <span className="ml-2 hover:cursor-pointer" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? (
                    <EyeVisibleSVG width={16} height={16} fill="currentColor" />
                  ) : (
                    <EyeHiddenSVG width={16} height={16} fill="currentColor" />
                  )}
                </span>
              </div>
            </div>
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
                          <img
                            className="mr-2 h-10 w-10 rounded-[50%] hover:cursor-pointer"
                            src={user.profileImage ?? 'https://picsum.photos/250'}
                            alt={`profile image of ${user.userName}`}
                          />
                        </Link>
                        <span className="text-sm font-semibold">{user.userName}</span>
                      </div>
                    </li>
                    <hr className="my-2 rounded border-t border-gray-500"></hr>
                    <li>
                      <Link
                        href={`/${user.userName}`}
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
                        href="/wallet"
                        legacyBehavior={false}
                        onClick={() => setShowAccountMenu(false)}
                        className="dropdown-item inline-flex w-full items-center whitespace-nowrap rounded bg-transparent py-1 px-1 text-sm font-normal text-white hover:bg-stone-700"
                      >
                        <WalletSVG width={20} height={20} className="mr-1" strokeWidth={1.5} />
                        <span>Wallet</span>
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
          </div>
        )}
        {authStatus === 'loading' && <div className="h-8 w-8 rounded-[50%] bg-stone-800" />}
        {authStatus === 'unauthenticated' && (
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
    </nav>
  )
}
