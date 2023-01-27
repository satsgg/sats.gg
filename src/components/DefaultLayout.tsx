import Head from 'next/head'
import { ReactNode } from 'react'
import { trpc } from '../utils/trpc'
import useAuthStore from '~/store/useAuthStore'
import { useEffect, useState } from 'react'
import { Navbar } from '~/components/Navbar'
import { FollowedChannelList } from '~/components/FollowedChannelList'
import { InteractionModal } from '~/components/InteractionModal'
import { Authenticate } from '~/components/Authenticate'
import { Transact } from '~/components/Transact'
import useNostrStore from '~/store/useNostrStore'
import { nostrClient } from '~/nostr/NostrClient'

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
  const [modal, setModal] = useState<'none' | 'login' | 'wallet'>('none')
  const utils = trpc.useContext()

  // const { connectToRelay, disconnectRelay } = useNostrStore()
  // TODO: Get relays, follows, users initially from localStorage

  // useEffect(() => {
  //   if (relays) {
  //     relays.forEach((relay) => connectToRelay(relay))
  //   }
  // }, [relays])

  // TODO: Initialize local storage of user (pubkey, privkey, relays, users etc)
  // useEffect(() => {
  //   // initialize local storage of user
  // })

  useEffect(() => {
    // get relays from settings first?
    // wouldn't want a singleton in that case
    // unless we instantiate singleton with non default array
    // yeet
    // const connect = async () => {
    //   await nostrClient.connect()
    // }
    // connect()
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
      <div className="flex h-screen w-screen flex-col overflow-hidden px-8 lg:px-0">
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
        <div className="flex grow">
          <div className="flex w-60 flex-none">
            {/* <FollowedChannelList userId={user?.id} /> */}
            <FollowedChannelList />
          </div>
          <div className="flex w-full grow bg-stone-900 text-white">
            <main className="flex w-full grow bg-stone-900">{children}</main>
          </div>
        </div>
      </div>
    </>
  )
}
