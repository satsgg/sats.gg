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

type DefaultLayoutProps = { children: ReactNode }

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  const { init: initSettingsStore } = useSettingsStore()
  const [modal, setModal] = useState<'none' | 'login'>('none')

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
      <div id="appContainer" className="h-screen w-screen bg-stone-900">
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
        <div id="contentContainer" className="flex h-full">
          <div id="followContainer" className="xs:hidden h-full shrink-0 lg:flex lg:w-60">
            <FollowedChannelList />
          </div>

          <main className="flex w-full text-white">{children}</main>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
