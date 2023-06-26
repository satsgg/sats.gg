import { useEffect, useRef, useState } from 'react'
import AddRelayForm from '~/components/Settings/AddRelayForm'
import RemoveableRelay from '~/components/Settings/RemoveableRelay'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { Event as NostrEvent, Filter } from 'nostr-tools'
import Button from '~/components/Button'
import { nostrClient } from '~/nostr/NostrClient'
import { useSubscription } from '~/hooks/useSubscription'
import { useProfile } from '~/hooks/useProfile'
import { displayName, parseZapRequest, validHexKey, validNpubKey } from '~/utils/nostr'
import { fmtMsg } from '~/utils/util'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { nip19 } from 'nostr-tools'
import { useRouter } from 'next/router'
import { Spinner } from '~/components/Spinner'

const ConfigureRelays = () => {
  const relays = useSettingsStore((state) => state.relays)
  const connectedRelays = useConnectedRelays()
  const removeRelay = useSettingsStore((state) => state.removeRelay)

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="font-md text-2xl">Relays</h2>
      <h3 className="font-sm text-sm text-white">
        Add or remove nostr relays to control where you receive notifications!
      </h3>

      {Array.from(relays).map((relay) => {
        return (
          <RemoveableRelay key={relay} relay={relay} connected={connectedRelays.has(relay)} removeRelay={removeRelay} />
        )
      })}

      {relays && relays.length === 0 && <p>Add some relays to get started!</p>}

      <AddRelayForm relays={relays} />
    </div>
  )
}

const NotificationsHandler = ({ notes }: { notes: NostrEvent[] }) => {
  const [notiQueue, setNotiQueue] = useState<NostrEvent[]>([])
  const [notiVisible, setNotiVisible] = useState(false)
  const [noti, setNoti] = useState<NostrEvent | null>(null)

  useEffect(() => {
    if (notes.length > 0 && notes[0]) {
      const noti = parseZapRequest(notes[0])
      if (noti) {
        setNotiQueue((prev) => {
          return [...prev, noti]
        })
      }
      if (!notiVisible) {
        setNotiVisible(true)
      }
    }
  }, [notes])

  useEffect(() => {
    const currentNoti = notiQueue[0]
    if (!currentNoti) {
      return
    }
    setNoti(currentNoti)

    if (!notiVisible) {
      setNotiVisible(true)
    }
  }, [notiVisible])

  return (
    <>
      {notiVisible && (
        <div
          className="flex h-full animate-alert items-center justify-center text-white"
          onAnimationStart={() => {
            console.debug('queue', notiQueue)
            console.debug('now display', noti)
            setNotiQueue((prev) => {
              return [...prev.slice(1)]
            })
          }}
          onAnimationEnd={() => {
            setNoti(null)
            setNotiVisible(false)
          }}
        >
          {noti && <Notification event={noti} />}
        </div>
      )}
    </>
  )
}

const Notification = ({ event }: { event: NostrEvent }) => {
  const { profile, isLoading } = useProfile(event.pubkey)

  return (
    <div className="flex flex-col sm:w-2/3 lg:w-1/3">
      <p className="text-3xl">
        <span className="font-bold text-primary">{displayName(event.pubkey, profile).slice(0, 18)}</span> zapped{' '}
        {event.tags[1][1] / 1000} sats!
      </p>
      <p className="break-words text-2xl">{fmtMsg(event.content)}</p>
    </div>
  )
}

export default function NotificationsWrapper() {
  const { init: initSettingsStore } = useSettingsStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [pubkey, setPubkey] = useState<string>('')
  const [chatChannelId, setChatChannelId] = useState<string>('')

  const { query, isReady } = useRouter()
  // always true?
  if (!isReady) {
    return (
      <div className="flex h-full w-full content-center justify-center">
        <Spinner height={6} width={6} />
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({
      pubkey: z.string(),
      chatChannelId: z.string(),
    }),
    defaultValues: {
      pubkey: (query.pubkey as string) || '',
      chatChannelId: (query.id as string) || '',
    },
  })

  const onSubmit = (data: { pubkey: string; chatChannelId: string }) => {
    if (data.pubkey.startsWith('npub1')) {
      if (!validNpubKey(data.pubkey)) {
        setError('pubkey', { message: 'Invalid npub key' })
        return
      }
      let { type, data: nipData } = nip19.decode(data.pubkey)
      setPubkey(nipData as string)
    } else if (!validHexKey(data.pubkey)) {
      setError('pubkey', { message: 'Invalid hex public key' })
      return
    } else {
      setPubkey(data.pubkey)
    }

    // have good hex pub now
    if (data.chatChannelId !== '') {
      console.debug('should validate chat channel id')
      if (data.chatChannelId.length !== 64) {
        setError('chatChannelId', { message: 'Invalid chat channel ID' })
        return
      }
      setChatChannelId(data.chatChannelId)
    }

    setShowNotifications(true)
  }

  useEffect(() => {
    initSettingsStore()
    nostrClient.connect()

    const timer = setInterval(() => {
      nostrClient.connect()
    }, 1000 * 60 * 5) // reconnect every 5 minutes

    return () => {
      clearInterval(timer)
    }
  }, [])

  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered

  const getFilters = () => {
    const filters: Filter[] = []
    if (pubkey === '') return filters
    filters.push({
      kinds: [9735],
      since: now.current,
      // NOTE: If pulling in old events, they can come in out of order
      // only use to test notification display
      // since: now.current - 1000 * 60 * 60 * 24,
      '#p': [pubkey || ''],
    })

    if (chatChannelId !== '')
      filters.push({
        kinds: [9735],
        since: now.current,
        '#p': [pubkey || ''],
        '#e': [chatChannelId],
      })

    return filters
  }

  const notes = useSubscription(pubkey || '', getFilters(), true, 100)

  return (
    <div className="flex h-full w-full justify-center overflow-y-auto text-white">
      {!showNotifications ? (
        <div className="flex w-full flex-col gap-2 overflow-y-auto pr-4 sm:w-2/3 lg:w-1/3">
          <h2 className="font-md text-2xl">Event Query</h2>
          <h3 className="font-sm text-sm text-white">
            These values can be populated in OBS Browser Source using URL search params!
          </h3>
          <h3 className="font-sm text-sm text-white">
            ex. https://sats.gg/notifications?pubkey={'[pubkey/npub]'}&id={'[chat channel ID]'}
          </h3>
          <form spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
            <input
              className={`${
                errors.pubkey ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-primary'
              } focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic  focus:bg-slate-900 focus:outline-none`}
              type="text"
              placeholder="hex public key / npub..."
              autoComplete="off"
              {...register('pubkey')}
            />
            {errors.pubkey && <p className="text-sm ">{errors.pubkey.message}</p>}
          </form>
          <form spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
            <input
              className={`${
                errors.chatChannelId ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-primary'
              } focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic  focus:bg-slate-900 focus:outline-none`}
              type="text"
              placeholder="chat channel ID (optional)..."
              autoComplete="off"
              {...register('chatChannelId')}
            />
            {errors.chatChannelId && <p className="text-sm ">{errors.chatChannelId.message}</p>}
          </form>
          <Button onClick={handleSubmit(onSubmit)}>SHOW NOTIFICATIONS</Button>
          <ConfigureRelays />
        </div>
      ) : (
        <NotificationsHandler notes={notes} />
      )}
    </div>
  )
}
NotificationsWrapper.getLayout = function () {
  return <NotificationsWrapper />
}
