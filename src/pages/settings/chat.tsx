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
import { channel } from 'diagnostics_channel'

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

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    // setError,
    // setValue,
    // getValues,
    // watch,
    reset: resetUpdate,
    // formState: { errors },
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

  useEffect(() => {
    console.debug('channelMetadata effect', channelMetadata)
    resetUpdate({ ...channelMetadata })
  }, [channelMetadata?.name, channelMetadata?.about, channelMetadata?.picture])

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
          <div className="flex">
            <div className="flex grow flex-col gap-2">
              <div>
                <p>Name</p>
                <Input name={'name'} register={registerCreate} />
              </div>
              <div>
                <p>About</p>
                <Input name={'about'} register={registerCreate} rows={1} />
              </div>
              <div>
                <p>Picture URL</p>
                <Input name={'picture'} register={registerCreate} />
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

        {/* <h2 className="font-md text-xl">Saved Chat Room</h2>
        <div>
          <h3 className="font-sm text-sm text-gray-400">
            Your saved chat room ID. If empty, create your first chat room above!
          </h3>
          <p>Chat Room ID</p>
          <CopyValueBar value={user?.chatChannelId} />
        </div> */}

        <div className="flex flex-col gap-1 pt-6">
          {/* <h3 className="font-md text-xl">Set Chat Room by ID</h3> */}
          <p>Channel ID</p>
          <div className="inline-flex w-full gap-4">
            <Input name={'id'} register={registerCreate} placeholder="Existing chat room ID..." />
            <button
              className="inline-flex w-32 shrink-0 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white"
              // disabled={refreshStreamKeyMutation.isLoading}
              // onClick={onSubmitRefreshStreamKey}
            >
              Save
            </button>
          </div>
          <h3 className="font-sm text-sm text-gray-400">
            Chat rooms are based on nostr and can be created and imported from anywhere.
          </h3>
        </div>

        {/* TODO: Show existing chat channel */}
        {user?.chatChannelId && (
          <div className="flex flex-col gap-4 pt-6">
            <div>
              <p>Channel ID</p>
              <CopyValueBar value={user.chatChannelId} />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {/* <div className="h-52 w-52 bg-gray-50" /> */}
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
                    <Input name={'picture'} register={registerUpdate} />
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
          </div>
        )}
      </div>
    </div>
  )
}

Chat.getLayout = getSettingsLayout
