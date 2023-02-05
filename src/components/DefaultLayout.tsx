import Head from 'next/head'
import { ReactNode } from 'react'
import { trpc } from '../utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { useEffect, useState } from 'react'
import { Navbar } from '~/components/Navbar'
import { FollowedChannelList } from '~/components/FollowedChannelList'
import { InteractionModal } from '~/components/InteractionModal'
import { Authenticate } from '~/components/Authenticate'
import { Transact } from '~/components/Transact'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from '~/hooks/useSettingsStore'

type DefaultLayoutProps = { children: ReactNode }

const relays = [
  'wss://brb.io',
  'wss://relay.damus.io',
  // "wss://nostr-relay.wlvs.space",
  // "wss://nostr.fmt.wiz.biz",
  // "wss://nostr.oxtr.dev",
  'wss://arc1.arcadelabs.co',
  'wss://relay.nostr.ch',
]

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  const { user, setUser, setStatus, storeToken, storeLogin, setNym, unsetNym, setShowBalance } = useAuthStore()
  const { init: initSettingsStore } = useSettingsStore()
  const [modal, setModal] = useState<'none' | 'login' | 'wallet'>('none')
  const utils = trpc.useContext()

  // TODO: Initialize local storage of user (pubkey, privkey, relays, users etc)
  // useEffect(() => {
  //   // initialize local storage of user
  // })

  useEffect(() => {
    initSettingsStore()
    nostrClient.connect()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      storeLogin(token)
    } else {
      setNym()
      setStatus('unauthenticated')
    }
    if (storeToken) {
      utils.auth.getMe
        .fetch()
        .then((data) => {
          setUser(data)
          setModal('none')
          unsetNym()
        })
        .catch((error) => {
          console.log('errorrrrr', error)
          setStatus('unauthenticated')
        })
    }
  }, [storeToken])

  useEffect(() => {
    const showBalance = localStorage.getItem('showBalance')
    if (showBalance !== null) {
      setShowBalance(JSON.parse(showBalance))
    } else {
      setShowBalance(false)
    }
  }, [])

  return (
    <>
      <Head>
        <title>SATS.GG</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div id="appContainer" className="h-screen w-screen bg-stone-900">
        <Navbar openAuthenticate={() => setModal('login')} openTransact={() => setModal('wallet')} />
        <div>
          {
            {
              login: (
                <InteractionModal title={'Log In'} close={() => setModal('none')}>
                  <Authenticate />
                </InteractionModal>
              ),
              wallet: (
                <InteractionModal title={'Wallet'} close={() => setModal('none')}>
                  <Transact />
                </InteractionModal>
              ),
              none: null,
            }[modal]
          }
        </div>
        <div id="contentContainer" className="flex h-full">
          <div id="followContainer" className="flex h-full w-60 shrink-0">
            <FollowedChannelList />
          </div>

          <main className="flex w-full text-white">{children}</main>
        </div>
      </div>
    </>
  )
}
