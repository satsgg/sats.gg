import { trpc } from '~/utils/trpc'
import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface TipProps {
  amount: number
  toUserId: string
  toUserName: string
  done: (payed: boolean) => void
}

export const TipModule = ({ amount, toUserId, toUserName, done }: TipProps) => {
  const utils = trpc.useContext()
  const { data: invoiceData, refetch: refetch } = trpc.invoice.createInvoice.useQuery(
    {
      amount: amount,
      toUserId: toUserId,
      toUserName: toUserName,
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
        done(true)
        return false
      },
    },
  )

  useEffect(() => {
    refetch()
  }, [])

  return (
    <div className="w-full rounded border border-gray-300">
      <div className="flex items-center justify-center border-b p-1">
        <p className="text-xl">Tip</p>
      </div>

      <p className="pt-3 text-center text-xl font-bold">{amount} sats</p>
      <div className="flex flex-col gap-4 py-3 px-2">
        {invoiceData && (
          <div className={'wrap flex w-full flex-col items-center justify-center gap-8'}>
            <a href={`lightning:${invoiceData.bolt11}`}>
              <QRCodeSVG
                value={invoiceData.bolt11}
                level={'Q'}
                size={200}
                includeMargin
                className="rounded border-8 border-primary"
              />
            </a>
            {/* pollingQRCode broken here. the input grows out of the div */}
            {/* <div className="w-max-full inline-flex w-full"> */}
            {/* <div className="w-full inline-flex truncate w-12">
              <input
                type="button"
                // size={5}
                className="min-w-0 w-12 text-clip rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary focus:bg-slate-900"
                // onClick={handleUrlStringClick}
                value={invoiceData.bolt11}
              />
            </div> */}
            {/* <Spinner /> */}
          </div>
        )}
        {!invoiceData && (
          <div className="flex w-full items-center justify-center">
            <div className="h-[200px] w-[200px] rounded bg-gray-600" />
          </div>
        )}
        <div className="flex items-center justify-end ">
          <button
            id={'modal-close'}
            className="background-transparent px-6 text-sm font-bold uppercase text-primary outline-none transition-all duration-150 ease-linear focus:outline-none"
            type="button"
            onClick={() => done(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
