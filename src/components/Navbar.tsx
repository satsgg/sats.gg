import useAuthStore from '~/store/useAuthStore'
import { useState } from 'react'
import ClickAwayListener from 'react-click-away-listener'
import Link from 'next/link'
import { trpc } from '~/utils/trpc'

interface HeaderProps {
  openAuthenticate: () => void
  openTransact: () => void
}

export const Navbar = ({ openAuthenticate, openTransact }: HeaderProps) => {
  const { user, status: authStatus, logout, showBalance, setShowBalance } = useAuthStore()
  const [showAccountMenu, setShowAccountMenu] = useState(false)

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-1 h-4 text-primary"
                    fill="currentColor"
                  >
                    <path d="M18.496 10.709l-8.636 8.88c-.24.246-.638-.039-.482-.345l3.074-6.066a.3.3 0 00-.268-.436H5.718a.3.3 0 01-.214-.51l8.01-8.115c.232-.235.618.023.489.328L11.706 9.86a.3.3 0 00.28.417l6.291-.078a.3.3 0 01.22.509z" />
                  </svg>
                  <span className="w-11">{showBalance ? user.balance : '*******'}</span>
                </span>
                <span className="ml-2 hover:cursor-pointer" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4" fill="currentColor">
                      <path d="M12 14a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path
                        fillRule="evenodd"
                        d="M21 12c0 2.761-4.03 5-9 5s-9-2.239-9-5 4.03-5 9-5 9 2.239 9 5zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4" fill="currentColor">
                      <path d="M14.33 7.17C13.588 7.058 12.807 7 12 7c-4.97 0-9 2.239-9 5 0 1.44 1.096 2.738 2.85 3.65l2.362-2.362a4 4 0 015.076-5.076l1.043-1.043zM11.23 15.926a4 4 0 004.695-4.695l2.648-2.647C20.078 9.478 21 10.68 21 12c0 2.761-4.03 5-9 5-.598 0-1.183-.032-1.749-.094l.98-.98zM17.793 5.207a1 1 0 111.414 1.414L6.48 19.35a1 1 0 11-1.414-1.414L17.793 5.207z"></path>
                    </svg>
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
                  // href="#"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={() => setShowAccountMenu((showAccountMenu) => !showAccountMenu)}
                >
                  <svg className="h-8 w-8" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M16 7.992C16 3.58 12.416 0 8 0S0 3.58 0 7.992c0 2.43 1.104 4.62 2.832 6.09.016.016.032.016.032.032.144.112.288.224.448.336.08.048.144.111.224.175A7.98 7.98 0 0 0 8.016 16a7.98 7.98 0 0 0 4.48-1.375c.08-.048.144-.111.224-.16.144-.111.304-.223.448-.335.016-.016.032-.016.032-.032 1.696-1.487 2.8-3.676 2.8-6.106zm-8 7.001c-1.504 0-2.88-.48-4.016-1.279.016-.128.048-.255.08-.383a4.17 4.17 0 0 1 .416-.991c.176-.304.384-.576.64-.816.24-.24.528-.463.816-.639.304-.176.624-.304.976-.4A4.15 4.15 0 0 1 8 10.342a4.185 4.185 0 0 1 2.928 1.166c.368.368.656.8.864 1.295.112.288.192.592.24.911A7.03 7.03 0 0 1 8 14.993zm-2.448-7.4a2.49 2.49 0 0 1-.208-1.024c0-.351.064-.703.208-1.023.144-.32.336-.607.576-.847.24-.24.528-.431.848-.575.32-.144.672-.208 1.024-.208.368 0 .704.064 1.024.208.32.144.608.336.848.575.24.24.432.528.576.847.144.32.208.672.208 1.023 0 .368-.064.704-.208 1.023a2.84 2.84 0 0 1-.576.848 2.84 2.84 0 0 1-.848.575 2.715 2.715 0 0 1-2.064 0 2.84 2.84 0 0 1-.848-.575 2.526 2.526 0 0 1-.56-.848zm7.424 5.306c0-.032-.016-.048-.016-.08a5.22 5.22 0 0 0-.688-1.406 4.883 4.883 0 0 0-1.088-1.135 5.207 5.207 0 0 0-1.04-.608 2.82 2.82 0 0 0 .464-.383 4.2 4.2 0 0 0 .624-.784 3.624 3.624 0 0 0 .528-1.934 3.71 3.71 0 0 0-.288-1.47 3.799 3.799 0 0 0-.816-1.199 3.845 3.845 0 0 0-1.2-.8 3.72 3.72 0 0 0-1.472-.287 3.72 3.72 0 0 0-1.472.288 3.631 3.631 0 0 0-1.2.815 3.84 3.84 0 0 0-.8 1.199 3.71 3.71 0 0 0-.288 1.47c0 .352.048.688.144 1.007.096.336.224.64.4.927.16.288.384.544.624.784.144.144.304.271.48.383a5.12 5.12 0 0 0-1.04.624c-.416.32-.784.703-1.088 1.119a4.999 4.999 0 0 0-.688 1.406c-.016.032-.016.064-.016.08C1.776 11.636.992 9.91.992 7.992.992 4.14 4.144.991 8 .991s7.008 3.149 7.008 7.001a6.96 6.96 0 0 1-2.032 4.907z" />
                  </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="mr-1 h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                          />
                        </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                          />
                        </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="mr-1 h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                          />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="mr-1 h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                            />
                          </svg>
                          Log Out
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mr-1.5 h-4"
              data-v-4fa90e7f=""
            >
              <path d="M18.496 10.709l-8.636 8.88c-.24.246-.638-.039-.482-.345l3.074-6.066a.3.3 0 00-.268-.436H5.718a.3.3 0 01-.214-.51l8.01-8.115c.232-.235.618.023.489.328L11.706 9.86a.3.3 0 00.28.417l6.291-.078a.3.3 0 01.22.509z" />
            </svg>
            <span>Log In</span>
          </button>
        )}
      </div>
    </nav>
  )
}
