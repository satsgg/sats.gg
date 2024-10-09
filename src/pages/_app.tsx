import { NextPage } from 'next'
import { AppProps } from 'next/app'
import { AppType } from 'next/dist/shared/lib/utils'
import { ReactElement, ReactNode } from 'react'
import { DefaultLayout } from '~/components/DefaultLayout'
import { trpc } from '~/utils/trpc'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}
const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
  const router = useRouter()
  const isDashboard = router.pathname === '/dashboard'

  const getLayout =
    // Component.getLayout ?? ((page) => <DefaultLayout hideFollowedChannels={isDashboard}>{page}</DefaultLayout>)
    Component.getLayout ??
    ((page) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <DefaultLayout hideFollowedChannels={isDashboard}>{page}</DefaultLayout>
      </ThemeProvider>
    ))

  return getLayout(<Component {...pageProps} />)
}) as AppType

export default trpc.withTRPC(MyApp)
