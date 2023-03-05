import Head from 'next/head'
import { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Authenticate } from '~/components/Authenticate'
import { Navbar } from '~/components/Navbar'
import { FollowedChannelList } from '~/components/FollowedChannelList'
import { InteractionModal } from '~/components/InteractionModal'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from '~/hooks/useSettingsStore'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useMediaQuery from '~/hooks/useMediaQuery'

type DefaultLayoutProps = { children: ReactNode }

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  const { init: initSettingsStore } = useSettingsStore()
  const [modal, setModal] = useState<'none' | 'login'>('none')
  // False when < 1024 px (< tailwind lg)
  const collapse = !useMediaQuery('(min-width: 1024px)')
  const [toggleCollapse, setToggleCollapse] = useState(false)

  // TODO: Initialize local storage of user (pubkey, privkey, relays, users etc)
  // useEffect(() => {
  //   // initialize local storage of user
  // })

  useEffect(() => {
    initSettingsStore()
    nostrClient.connect()
  }, [])

  return (
    <>
      <Head>
        <title>SATS.GG</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div id="appContainer" className="flex h-screen w-screen flex-col bg-stone-900">
        <Navbar openAuthenticate={() => setModal('login')} />
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
        <div id="contentContainer" className="relative flex grow">
          <div
            id="followContainer"
            className={`${collapse || toggleCollapse ? 'w-12' : 'w-60'} hidden h-full shrink-0 sm:flex`}
          >
            <FollowedChannelList
              collapse={collapse}
              toggleCollapse={toggleCollapse}
              setToggleCollapse={setToggleCollapse}
            />
          </div>

          <main className="flex h-full w-full flex-col overflow-y-auto text-white sm:flex-row">{children}</main>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
