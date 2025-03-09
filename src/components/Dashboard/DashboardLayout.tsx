import Head from 'next/head'
import { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Authenticate } from '~/components/Authenticate'
import { Navbar } from '~/components/Dashboard/Navbar'
import { InteractionModal } from '~/components/InteractionModal'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from '~/hooks/useSettingsStore'
import useHasMounted from '~/hooks/useHasMounted'
import useAuth from '~/hooks/useAuth'
import { Toaster } from '@/components/ui/toaster'
import useAuthStore from '~/hooks/useAuthStore'
import { Loader2 } from 'lucide-react'

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { init: initSettingsStore } = useSettingsStore()
  useAuth()
  const view = useAuthStore((state) => state.view)

  const isMounted = useHasMounted()

  const [modal, setModal] = useState<'none' | 'login'>('none')

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

  return (
    <>
      <Head>
        <title>SATS.GG dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />

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
      <div id="contentContainer" className={`flex h-full overflow-hidden ${!isMounted ? 'invisible' : ''}`}>
        {!view && (
          <div className="flex h-full w-full items-center justify-center bg-background">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        )}
        {view && view !== 'authenticated' && (
          <div className="flex h-full w-full items-center justify-center bg-background">
            You must be logged in to view this page
          </div>
        )}
        {view === 'authenticated' && (
          <main className="flex h-full w-full min-w-0 flex-col sm:flex-row">{children}</main>
        )}
      </div>

      <Toaster />
    </>
  )
}
