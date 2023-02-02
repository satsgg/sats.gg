import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { trpc } from '~/utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { useEffect, useState } from 'react'
import { PollingQRCode } from '~/components/PollingQRCode'

type LoginUrlResponse = inferProcedureOutput<AppRouter['auth']['loginUrl']>

export const Authenticate = ({}) => {
  const utils = trpc.useContext()
  const { storeToken, storeLogin } = useAuthStore()

  const [loginUrl, setLoginUrl] = useState<LoginUrlResponse>({ secret: '', encoded: '' })

  const { data: dataWallets } = trpc.wallet.list.useQuery()

  trpc.auth.isLoggedIn.useQuery(
    { secret: loginUrl?.secret },
    {
      refetchInterval: (data) => {
        if (!storeToken) {
          if (!data?.user) {
            return 1000
          }
          storeLogin(data.user)
          return false
        }
        return false
      },
    },
  )

  useEffect(() => {
    utils.auth.loginUrl.fetch().then((data) => {
      setLoginUrl(data)
    })
  }, [])

  return (
    <div className={'gap-4'}>
      {/* <p className={'text-center'}>
                If you dont already have a <b>ln-url compliant Bitcoin wallet</b>, here is a list of candidates in
                alphabetical order:
            </p> */}
      {/* {dataWallets && (
                <div className={'flex flex-wrap justify-center gap-1'}>
                    {dataWallets.map((wallet, index) => {
                        return (
                            <a key={index} href={wallet.url} className={'underline hover:text-blue-500'}>
                                {wallet.name}
                                {index !== dataWallets.length - 1 && ', '}
                            </a>
                        )
                    })}
                </div>
            )} */}
      <PollingQRCode bolt11={loginUrl.encoded} />
    </div>
  )
}
