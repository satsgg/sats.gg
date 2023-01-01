import { trpc } from '~/utils/trpc'
import { useState } from 'react'
import { Deposit } from '~/components/Deposit'
import { Withdraw } from '~/components/Withdraw'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { SINGLE_TRANSACTION_CAP } from '~/server/service/constants'
import TransactSVG from '~/svgs/transact.svg'

export const createInvoiceInput = z.object({
  amount: z.number().min(1).max(SINGLE_TRANSACTION_CAP),
  toUserName: z.string().optional(),
  toUserId: z.string().uuid().optional(),
})

export const Transact = ({}) => {
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: createInvoiceInput,
    defaultValues: {
      amount: 1,
      toUserName: undefined,
      toUserId: undefined,
    },
  })

  const [transactMode, setTransactMode] = useState<'none' | 'deposit' | 'withdraw'>('none')

  const { data: myBalance, isLoading: myBalanceIsLoading } = trpc.accounting.myBalance.useQuery()

  return (
    <div>
      {
        {
          none: (
            <div className={'flex flex-col items-center gap-4'}>
              {!myBalanceIsLoading && (
                <div id={'transact-balance-display'}>
                  <p className="text-3xl font-bold text-white">{myBalance} sats</p>
                </div>
              )}
              <div className="mb-3 inline-flex justify-center xl:w-96">
                <form className="w-3/4">
                  <div className="relative float-left w-full after:absolute after:right-5 after:top-1.5 after:content-['sats']">
                    <input
                      type="text"
                      autoComplete="off"
                      className="w-full rounded border-2 border-gray-500 bg-stone-700 py-1 px-4 outline-none focus:border-primary focus:bg-slate-900"
                      {...register('amount', { valueAsNumber: true, min: 1, required: true })}
                    />
                  </div>
                </form>
              </div>
              <div className={'flex w-full flex-row'}>
                <button
                  disabled={!!errors.amount}
                  className="mr-2 mb-2 flex grow flex-col items-center rounded bg-primary px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary/80"
                  onClick={() => setTransactMode('deposit')}
                >
                  <TransactSVG width={24} height={24} />
                  Deposit
                </button>
                <button
                  className="mr-2 mb-2 flex grow flex-col items-center rounded bg-primary px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary/80"
                  onClick={() => setTransactMode('withdraw')}
                >
                  <TransactSVG width={24} height={24} />
                  Withdraw
                </button>
              </div>
            </div>
          ),
          deposit: <Deposit amount={getValues('amount')} done={() => setTransactMode('none')} />,
          withdraw: <Withdraw done={() => setTransactMode('none')} />,
        }[transactMode]
      }
    </div>
  )
}
