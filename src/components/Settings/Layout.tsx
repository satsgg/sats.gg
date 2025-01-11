import { useRouter } from 'next/router'
import Link from 'next/link'
import { ReactNode, ReactElement } from 'react'
import { DefaultLayout } from '../DefaultLayout'
import useAuthStore from '~/hooks/useAuthStore'

// TODO: Overlap highlighted tab button bottom border with the full tabs bottom border
// they are currently stacked
const TabButton = ({ tab, current = false }: { tab: string; current: boolean }) => {
  const selectedStyle = 'text-orange-400 border-b border-orange-400'
  const styling = current ? selectedStyle : ''
  return (
    <Link
      href={'/settings/' + tab}
      legacyBehavior={false}
      className={`${styling} py-1 capitalize hover:cursor-pointer hover:border-b hover:border-orange-400 hover:text-orange-400`}
    >
      {tab}
    </Link>
  )
}

const SettingsLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const lastSegment = router.pathname.split('/').filter(Boolean).pop()

  const view = useAuthStore((state) => state.view)

  let tabs = ['profile', 'relays']
  // view === 'authenticated' && tabs.push('stream')
  // view === 'authenticated' && tabs.push('chat')
  view === 'authenticated' && tabs.push('zaps')

  // useEffect(() => {
  //   const logRelaysNostr = async () => {
  //     console.log(await window.nostr.getRelays())
  //     // alby has a list of default relays and permissions... not settable in ext though
  //     // what about getting the relays from kind0?
  //     // async window.nostr.getRelays(): { [url: string]: {read: boolean, write: boolean} } // returns a basic map of relay urls to relay policies
  //   }

  //   logRelaysNostr()
  // }, [])

  return (
    <div className="flex w-full flex-col bg-background px-8 pt-8 text-white">
      <h1 className="mb-2 text-4xl font-bold">Settings</h1>

      <div className="flex space-x-6 border-b border-gray-500">
        {tabs.map((tab) => {
          return <TabButton tab={tab} key={tab} current={router.pathname.includes(tab)} />
        })}
      </div>
      <div className="flex flex-col overflow-y-auto pt-4">
        <h1 className="mb-6 text-2xl font-bold capitalize">{lastSegment}</h1>
        {children}
      </div>
    </div>
  )
}

export default function getSettingsLayout(page: ReactElement) {
  return (
    <DefaultLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </DefaultLayout>
  )
}
