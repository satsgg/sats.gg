import useSettingsStore from '~/hooks/useSettingsStore'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'

const AddRelayForm = ({ relays }: { relays: string[] }) => {
  const addRelay = useSettingsStore((state) => state.addRelay)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({ newRelay: z.string().startsWith('wss://') }),
    defaultValues: {
      newRelay: '',
    },
  })

  const onSubmit = (data: { newRelay: string }) => {
    const relay = data.newRelay.trim()
    if (relays.includes(relay)) {
      setError('newRelay', { type: 'unique', message: 'Relay already exists' })
      // focus input? (if they click button submit)
      return
    }

    addRelay(relay)
    setValue('newRelay', '')
  }

  return (
    <div>
      <label>Add new relay</label>
      <div className="flex items-center gap-x-2">
        <form className="grow " spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
          <input
            className={`${
              errors.newRelay && 'focus:border-red-500'
            } focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow focus:border-primary focus:bg-slate-900 focus:outline-none`}
            type="text"
            placeholder="wss://relay.current.fyi"
            autoComplete="off"
            {...register('newRelay')}
          />
        </form>
        {/* <button className="">ADD</button> */}
        <button
          type="submit"
          className={`${
            errors.newRelay ? 'bg-gray-500' : ''
          } align-right inline-flex items-center justify-center rounded bg-primary px-3 py-2 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg`}
          disabled={errors.newRelay ? true : false}
          onClick={handleSubmit(onSubmit)}
        >
          ADD
        </button>
      </div>
      {errors.newRelay && <p>{errors.newRelay.message}</p>}
    </div>
  )
}

export default AddRelayForm
