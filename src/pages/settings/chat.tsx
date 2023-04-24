import { useState, useEffect } from 'react'
import getSettingsLayout from '~/components/Settings/Layout'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { trpc } from '~/utils/trpc'
import Input from '~/components/Settings/Input'
import { createChannelEvent, updateChannelEvent } from '~/utils/nostr'
import { verifySignature, validateEvent } from 'nostr-tools'
import { toast } from 'react-toastify'
import { nostrClient } from '~/nostr/NostrClient'
import useCanSign from '~/hooks/useCanSign'
import useAuthStore from '~/hooks/useAuthStore'
import CopyValueBar from '~/components/Settings/CopyBar'
import useChannelMetadata from '~/hooks/useChannelMetadata'

export default function Chat() {
  const canSign = useCanSign()
  const { user, setUser, status: authStatus } = useAuthStore()
  const pubkey = useAuthStore((state) => state.pubkey)
  const chatChannelMutation = trpc.user.setChatChannelId.useMutation()
  const utils = trpc.useContext()
  const channelMetadata = useChannelMetadata(pubkey, user?.chatChannelId)

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
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

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: updateErrors },
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

  const {
    register: registerId,
    handleSubmit: handleSubmitId,
    formState: { errors: idErrors },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({
      id: z.string().length(64),
    }),
    defaultValues: {
      id: '',
    },
  })

  const onSubmitCreate = async (data: any) => {
    if (!pubkey) return

    const event = createChannelEvent(pubkey, data.name, data.about, data.picture)

    try {
      const signedEvent = await window.nostr.signEvent(event)
      console.debug('signedEvent', signedEvent)
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      console.debug('event id', signedEvent.id)
      nostrClient.publish(signedEvent)
      await onSubmitChatChannel(signedEvent.id)

      // TODO: If no existing chat room, auto save the ID to backend
      // should only save if enough relays see it... and show the user the relay seen status
      toast.success('Chat room created!', {
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

  const onSubmitChatChannel = async (chatChannelId: string) => {
    setUser(await chatChannelMutation.mutateAsync({ chatChannelId: chatChannelId }))
    await utils.invalidate()
  }

  const onSubmitById = async (data: any) => {
    if (!pubkey) return

    try {
      // TODO: Warn if existing
      await onSubmitChatChannel(data.id)
      resetUpdate({ name: '', about: '', picture: '' })
      toast.success('Saved chat room by ID!', {
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

  useEffect(() => {
    resetUpdate({ ...channelMetadata })
  }, [user?.chatChannelId, channelMetadata?.name, channelMetadata?.about, channelMetadata?.picture])

  const onSubmitUpdate = async (data: any) => {
    if (!pubkey || !user?.chatChannelId) return

    const event = updateChannelEvent(pubkey, user.chatChannelId, data.name, data.about, data.picture)

    try {
      const signedEvent = await window.nostr.signEvent(event)
      console.debug('signedEvent', signedEvent)
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      console.debug('event id', signedEvent.id)
      nostrClient.publish(signedEvent)

      toast.success('Chat room updated!', {
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

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md text-xl">Chat Room</h2>
      <h3 className="font-sm text-sm text-gray-400">
        Create or configure your channel chat room. Chat rooms are based on Nostr nip-28. Sats.gg only saves your chat
        room ID. Chat room name, about, and picture can be updated after creation.
      </h3>

      <div className="flex flex-col gap-6 divide-y divide-gray-400 rounded border border-gray-500 bg-stone-800 px-6 py-4">
        <div className="flex flex-col gap-4">
          <h2 className="font-md text-xl">Create Chat Room</h2>
          <div className="flex">
            <div className="flex grow flex-col gap-2">
              <div>
                <p>Name</p>
                <Input name={'name'} placeholder="Chad's Live Chat" register={registerCreate} />
              </div>
              <div>
                <p>About</p>
                <Input
                  name={'about'}
                  placeholder="A place for us to chat. Come and kick it!"
                  register={registerCreate}
                  rows={1}
                />
              </div>
              <div>
                <p>Picture URL</p>
                <Input
                  name={'picture'}
                  placeholder="https://robohash.org/69"
                  error={createErrors?.picture ? true : false}
                  register={registerCreate}
                />
                {createErrors?.picture && <p className="italic text-red-600">{createErrors.picture.message}</p>}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSign}
              className="align-right inline-flex h-8 w-32 shrink-0 items-center justify-center rounded bg-primary px-2 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-gray-500"
              onClick={handleSubmitCreate(onSubmitCreate)}
            >
              Create
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-6">
          <p>Import Chat Room</p>
          <div className="inline-flex w-full gap-4">
            <Input
              name={'id'}
              register={registerId}
              error={idErrors.id ? true : false}
              placeholder="Existing kind 40 event ID..."
            />
            <button
              className="inline-flex w-32 shrink-0 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white"
              // disabled={refreshStreamKeyMutation.isLoading}
              onClick={handleSubmitId(onSubmitById)}
            >
              Save
            </button>
          </div>
          {idErrors?.id && <p className="italic text-red-600">{idErrors.id.message}</p>}
          <h3 className="font-sm text-sm text-gray-400">
            Chat rooms are based on nostr and can be created and imported from anywhere.
          </h3>
        </div>

        {user?.chatChannelId && (
          <div className="flex flex-col gap-4 pt-6">
            <h2 className="font-md text-xl">Your Chat Room</h2>

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <img
                  className="h-52 w-52"
                  src={channelMetadata?.picture ?? undefined}
                  alt={`profile image of ${user.chatChannelId}`}
                />
                <div className="flex grow flex-col gap-2">
                  <div>
                    <p>Name</p>
                    <Input name={'name'} register={registerUpdate} />
                  </div>
                  <div>
                    <p>About</p>
                    <Input name={'about'} register={registerUpdate} rows={1} />
                  </div>
                  <div>
                    <p>Picture URL</p>
                    <Input name={'picture'} error={updateErrors?.picture ? true : false} register={registerUpdate} />
                    {updateErrors?.picture && <p className="italic text-red-600">{updateErrors.picture.message}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canSign}
                  className="align-right inline-flex h-8 w-32 shrink-0 items-center justify-center rounded bg-primary px-2 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-gray-500"
                  onClick={handleSubmitUpdate(onSubmitUpdate)}
                >
                  Update
                </button>
              </div>
            </div>
            <div>
              <p>Channel ID</p>
              <CopyValueBar value={user.chatChannelId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

Chat.getLayout = getSettingsLayout
