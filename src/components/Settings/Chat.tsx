import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import Input from './Input'
import { createChannelEvent } from '~/utils/nostr'
import { verifySignature, validateEvent } from 'nostr-tools'

// name - string - Channel name
// about - string - Channel description
// picture - string - URL of channel picture
const Chat = () => {
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
    schema: z.object({
      name: z.string().optional(),
      about: z.string().optional(),
      picture: z.union([z.literal(''), z.string().trim().url()]),
    }),
    defaultValues: {
      name: '',
      about: '',
      picture: '',
    },
  })

  const onSubmit = async (data: any) => {
    console.log('data', data)
    const event = createChannelEvent(data.name, data.about, data.picture)
    try {
      const signedEvent = await window.nostr.signEvent(event)
      console.debug('signedEvent', signedEvent)
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')
    } catch (err) {
      console.error(err)
      // show error
    }
  }

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md mb-2 text-2xl">Chat</h2>
      <div className="flex flex-col gap-4 rounded border border-gray-500 bg-stone-800 px-6 py-4">
        <h2 className="font-md mb-2 text-xl">Create Chat Channel</h2>
        <div className="flex gap-4">
          <div className="h-52 w-52 border border-gray-500" />
          <div className="flex grow flex-col gap-2">
            <Input label={'Name'} name={'name'} register={register} />
            <Input label={'About'} name={'about'} register={register} />
            <Input label={'Picture URL'} name={'picture'} register={register} />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="align-right inline-flex h-8 w-32 items-center justify-center rounded bg-primary px-2 py-1 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg"
            onClick={handleSubmit(onSubmit)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
