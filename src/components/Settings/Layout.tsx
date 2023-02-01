import { useRouter } from 'next/router'
import Link from 'next/link'
import { ReactNode, ReactElement } from 'react'
import useAuthStore from '~/store/useAuthStore'
import { DefaultLayout } from '../DefaultLayout'
import { Spinner } from '../Spinner'

const TabButton = ({ tab, current = false }: { tab: string; current: boolean }) => {
  const selectedStyle = 'text-orange-400 border-b border-orange-400'
  const styling = current ? selectedStyle : ''
  return (
    <Link href={'/settings/' + tab}>
      <span
        className={`${styling} py-1 capitalize hover:cursor-pointer hover:border-b hover:border-orange-400 hover:text-orange-400`}
      >
        {tab}
      </span>
    </Link>
  )
}

const SettingsLayout = ({ children }: { children: ReactNode }) => {
  const { status: authStatus } = useAuthStore()
  const router = useRouter()

  const tabs = ['profile', 'stream', 'relays']

  const getContent = () => {
    if (authStatus === 'authenticated') {
      return <main>{children}</main>
    } else if (authStatus === 'unauthenticated') {
      return <p>You must be logged in to view this page</p>
    } else {
      return (
        <div className={'w-full text-center'}>
          <Spinner />
        </div>
      )
    }
  }

  return (
    <DefaultLayout>
      <div className="w-full space-y-4 bg-stone-900 py-8 px-8 text-white">
        <h1 className="text-4xl font-bold ">Settings</h1>

        <div className="flex space-x-6 border-b border-gray-500">
          {tabs.map((tab) => {
            return <TabButton tab={tab} current={router.pathname.includes(tab)} />
          })}
        </div>

        {getContent()}
      </div>
    </DefaultLayout>
  )
}

export default function getSettingsLayout(page: ReactElement) {
  return <SettingsLayout>{page}</SettingsLayout>
}
