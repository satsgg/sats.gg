import Head from 'next/head'
import { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Authenticate } from '~/components/Authenticate'
import { Navbar } from '~/components/Dashboard/Navbar'
import { FollowedChannelList } from '~/components/FollowedChannelList'
import { InteractionModal } from '~/components/InteractionModal'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from '~/hooks/useSettingsStore'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useMediaQuery from '~/hooks/useMediaQuery'
import useLayoutStore from '~/store/layoutStore'
import useHasMounted from '~/hooks/useHasMounted'
import useAuth from '~/hooks/useAuth'

type DashboardLayoutProps = { hideFollowedChannels?: boolean; children: ReactNode }

export const DashboardLayout = ({ hideFollowedChannels = false, children }: DashboardLayoutProps) => {
  const { init: initSettingsStore } = useSettingsStore()
  useAuth()

  const { leftBarUserClosed, userCloseLeftBar, rightBarUserClosed } = useLayoutStore()
  const isMounted = useHasMounted()

  const [modal, setModal] = useState<'none' | 'login'>('none')
  // False when < 1024 px (< tailwind lg)
  const autoCollapseLeftBar = !useMediaQuery('(min-width: 1024px)')

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    initSettingsStore()
    nostrClient.connect()

    const timer = setInterval(() => {
      nostrClient.connect()
    }, 1000 * 60 * 5) // reconnect every 5 minutes
    return () => {
      nostrClient.disconnect()
      clearInterval(timer)
    }
  }, [])
  console.debug('DashboardLayout???')

  const content = () => {
    // Make sure we get layout from localstorage before
    // displaying the content container to avoid shitfting
    if (!isMounted) {
      return null
      // <div className="flex h-full w-full content-center justify-center">
      //   <Spinner height={6} width={6} />
      // </div>
    }

    return (
      <div id="contentContainer" className="flex h-full overflow-hidden">
        <main className="flex h-full w-full min-w-0 flex-col text-white sm:flex-row">{children}</main>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>SATS.GG dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <Navbar /> */}
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div>
        {
          {
            login: (
              <InteractionModal title={'Log In'} close={() => setModal('none')}>
                <Authenticate close={() => setModal('none')} />
              </InteractionModal>
            ),
            none: null,
          }[modal]
        }
      </div>

      {content()}

      <ToastContainer />
    </>
  )
}
