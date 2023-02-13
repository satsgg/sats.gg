import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'

const RemoveableRelay = ({
  relay,
  connected,
  removeRelay,
}: {
  relay: string
  connected: boolean
  removeRelay: (relay: string) => void
}) => {
  return (
    <div className="flex items-center gap-x-2">
      <Relay relay={relay} connected={connected} />
      <button onClick={() => removeRelay(relay)}>🗑️</button>
    </div>
  )
}

const Relay = ({ relay, connected }: { relay: string; connected: boolean }) => {
  return (
    <div className="flex grow gap-x-2 rounded border border-gray-500 bg-stone-800 p-2">
      <span>{connected ? '✅' : '❌'}</span>
      <span>{relay}</span>
    </div>
  )
}

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

const Relays = () => {
  const relays = useSettingsStore((state) => state.relays)
  const removeRelay = useSettingsStore((state) => state.removeRelay)
  const connectedRelays = useConnectedRelays()

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md mb-2 text-2xl">Relays</h2>

      {Array.from(relays).map((relay) => {
        return (
          <RemoveableRelay key={relay} relay={relay} connected={connectedRelays.has(relay)} removeRelay={removeRelay} />
        )
      })}

      {relays && relays.length === 0 && <p>Add some relays to get started!</p>}

      <AddRelayForm relays={relays} />

      {/* TODO: recommended relays */}
    </div>
  )
}

export default Relays
