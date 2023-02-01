import { useRouter } from 'next/router'
import { ReactNode, ReactElement } from 'react'
import useAuthStore from '~/store/useAuthStore'
import { DefaultLayout } from '../DefaultLayout'
import { Spinner } from '../Spinner'

const SettingsLayout = ({ children }: { children: ReactNode }) => {
  const { status: authStatus } = useAuthStore()
  const router = useRouter()

  const highlightTab = () => {
    // console.log(router.pathname) === '/settings/profile'
    if (router.pathname.includes('profile')) {
      return 'profile'
    } else if (router.pathname.includes('relays')) {
      return 'relays'
    } else {
      return 'unknown'
    }
  }

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
      <div className="w-full bg-stone-900 py-10 px-8 text-white">
        {/* TODO: Make border under psuedo tabs */}
        <h1 className="mb-6 border-b border-gray-500 pb-4 text-4xl font-bold">Settings</h1>

        <p>{highlightTab()}</p>

        {getContent()}
      </div>
    </DefaultLayout>
  )
}

export default function getSettingsLayout(page: ReactElement) {
  return <SettingsLayout>{page}</SettingsLayout>
}
