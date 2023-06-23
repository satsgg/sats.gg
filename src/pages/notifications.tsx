import { useEffect, useRef, useState } from 'react'
import AddRelayForm from '~/components/Settings/AddRelayForm'
import RemoveableRelay from '~/components/Settings/RemoveableRelay'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { Event as NostrEvent, Filter } from 'nostr-tools'
import Button from '~/components/Button'
import { nostrClient } from '~/nostr/NostrClient'
import { useSubscription } from '~/hooks/useSubscription'

export default function Notifications() {
  const { init: initSettingsStore } = useSettingsStore()
  const relays = useSettingsStore((state) => state.relays)
  const removeRelay = useSettingsStore((state) => state.removeRelay)
  const connectedRelays = useConnectedRelays()
  const [showNotifications, setShowNotifications] = useState(false)
  // const [pubkey, setPubkey] = useState<string | null>(null)
  const [pubkey, setPubkey] = useState<string | null>(
    'e9038e10916d910869db66f3c9a1f41535967308b47ce3136c98f1a6a22a6150',
  )
  // const [chatChannelId, setChatChannelId] = useState<string | null>(null)
  const [chatChannelId, setChatChannelId] = useState<string | null>(
    '2a1f6a2474be93bda8dd1269edd75501d56d0000b3c9961f66e83afb985bee9d',
  )

  useEffect(() => {
    initSettingsStore()
    nostrClient.connect()

    const timer = setTimeout(() => {
      nostrClient.connect()
    }, 1000 * 60 * 5) // reconnect every 5 minutes

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered

  const filters: Filter[] = [
    {
      kinds: [9735],
      // since and limit don't really work well
      since: now.current - 1000 * 60 * 60 * 24,
      // separate filter for chat zap / quick zap?
      // or multiple #e?
      '#p': [pubkey || ''],
      '#e': [chatChannelId || ''],
    },
    {
      kinds: [9735],
      since: now.current - 1000 * 60 * 60 * 24,
      '#p': [pubkey || ''],
    },
  ]
  const notes = useSubscription(pubkey || '', filters, 250)

  const handleNotificationsClick = () => {
    setShowNotifications(true)
    document.querySelector('body')!.className = ''
  }

  // TODO: pubkey and chat event ID

  return (
    <>
      {!showNotifications ? (
        <div className="flex h-full w-full justify-center overflow-y-auto text-white">
          <div className="flex w-full flex-col gap-2 sm:w-2/3 lg:w-1/3">
            <h2 className="font-md text-2xl">Notification Relays</h2>
            <h3 className="font-sm text-sm text-white">
              Add or remove nostr relays to control where you receive notifications!
            </h3>

            {Array.from(relays).map((relay) => {
              return (
                <RemoveableRelay
                  key={relay}
                  relay={relay}
                  connected={connectedRelays.has(relay)}
                  removeRelay={removeRelay}
                />
              )
            })}

            {relays && relays.length === 0 && <p>Add some relays to get started!</p>}

            <AddRelayForm relays={relays} />
            <Button onClick={handleNotificationsClick}>SHOW NOTIFICATIONS</Button>
          </div>
        </div>
      ) : (
        <div className="">
          <p>notes</p>
          {notes.map((note) => {
            return <p>{note.id}</p>
          })}
        </div>
      )}
    </>
  )
}
Notifications.getLayout = function () {
  return <Notifications />
}
