import { NextPage } from 'next'
import { AppProps } from 'next/app'
import { AppType } from 'next/dist/shared/lib/utils'
import { ReactElement, ReactNode } from 'react'
import { DefaultLayout } from '~/components/DefaultLayout'
import { trpc } from '~/utils/trpc'
import '../styles/globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}
const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {getLayout(<Component {...pageProps} />)}
    </ThemeProvider>
  )
}) as AppType

export default trpc.withTRPC(MyApp)
