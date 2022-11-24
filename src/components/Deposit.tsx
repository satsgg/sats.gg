import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { trpc } from '~/utils/trpc'
import useAuthStore from '~/store/useAuthStore'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useForm } from 'react-hook-form'
import { PollingQRCode } from '~/components/PollingQRCode'

type LoginUrlResponse = inferProcedureOutput<AppRouter['auth']['loginUrl']>

interface DepositProps {
  done: () => void
  amount: number
}

export const Deposit = ({ amount, done }: DepositProps) => {
  const utils = trpc.useContext()
  const { data: invoiceData, refetch } = trpc.invoice.createInvoice.useQuery(
    {
      amount: amount,
      toUserId: undefined,
      toUserName: undefined,
    },
    {
      enabled: false,
      staleTime: Infinity,
    },
  )
  trpc.invoice.isInvoicePaid.useQuery(
    { lndId: invoiceData?.lndId ?? '', hash: invoiceData?.hash ?? '' },
    {
      refetchInterval: (data) => {
        if (!(data?.transactionStatus === 'SETTLED')) {
          return 1000
        }
        utils.accounting.myBalance.invalidate()
        done()
        return false
      },
    },
  )

  useEffect(() => {
    refetch()
  }, [])

  // if (!invoiceData) {
  //   return (
  //     <div className="flex items-center justify-center w-full">
  //       <div className="h-[300px] w-[300px] bg-gray-500 rounded" />
  //     </div>
  //   )
  // }

  return <div className={''}>{invoiceData && <PollingQRCode bolt11={invoiceData.bolt11} />}</div>
}
