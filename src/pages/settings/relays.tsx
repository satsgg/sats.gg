import getSettingsLayout from '~/components/Settings/Layout'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import RemoveableRelay from '~/components/Settings/RemoveableRelay'
import AddRelayForm from '~/components/Settings/AddRelayForm'

export default function Relays() {
  const relays = useSettingsStore((state) => state.relays)
  const removeRelay = useSettingsStore((state) => state.removeRelay)
  const connectedRelays = useConnectedRelays()

  return (
    <div className="flex w-11/12 flex-col gap-4 sm:w-3/5">
      <h2 className="font-md text-2xl">Relays</h2>
      <h3 className="font-sm text-sm text-gray-400">
        Add or remove nostr relays to control where you read and publish nostr events!
      </h3>

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

Relays.getLayout = getSettingsLayout
