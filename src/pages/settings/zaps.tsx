import getSettingsLayout from '~/components/Settings/Layout'
import { trpc } from '~/utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { Spinner } from '~/components/Spinner'
import { User } from '@prisma/client'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { toast } from 'react-toastify'

const Zaps = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const utils = trpc.useContext()
  const setDefaultZapAmountMutation = trpc.user.setDefaultZapAmount.useMutation()

  const onSubmitSetDefaultZapAmount = async (data: any) => {
    try {
      setUser(await setDefaultZapAmountMutation.mutateAsync({ defaultZapAmount: data.amount }))
      await utils.invalidate()
      toast.success('Updated default zap amount!', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    } catch (err: any) {
      console.error(err.message)
      toast.error(err.message, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({
      amount: z.number().positive().max(2100000000),
    }),
    defaultValues: {
      amount: user.defaultZapAmount,
    },
  })

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md text-2xl">Zaps</h2>
      <div className="flex flex-col gap-y-6 rounded border border-gray-500 bg-stone-800 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <div className="flex">
              <div className="flex grow flex-col gap-2">
                <div className="flex w-full gap-x-4">
                  <div className="w-1/3">
                    <p>Default Zap Amount</p>
                  </div>
                  <div className="flex w-2/3 gap-x-4">
                    <div className="relative w-full ">
                      <div className="absolute top-2/4 right-3 grid -translate-y-2/4 ">
                        <span className="text-gray-400">sats</span>
                      </div>
                      <input
                        type="number"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="1 -> 2100000000"
                        min={1}
                        className={`focus:shadow-outline h-8 w-full resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic focus:border-primary focus:bg-slate-900 focus:outline-none`}
                        {...register('amount', {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <button
                      className="inline-flex w-32 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white"
                      onClick={handleSubmit(onSubmitSetDefaultZapAmount)}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full gap-x-4">
              <div className="w-1/3"></div>
              <div className="w-2/3">
                {errors?.amount ? (
                  <p className="italic text-red-600">{errors.amount.message}</p>
                ) : (
                  <p className="italic text-gray-400">Enter an amount between 1 and 2100000000 sats</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ZapsSettingsWrapper({}) {
  const { user, setUser, status: authStatus } = useAuthStore()

  if (authStatus === 'unauthenticated') {
    return <p>You must be logged in to view this page</p>
  }

  if (user) {
    return <Zaps user={user} setUser={setUser} />
  }

  return (
    <div className={'w-full text-center'}>
      <Spinner />
    </div>
  )
}

ZapsSettingsWrapper.getLayout = getSettingsLayout
