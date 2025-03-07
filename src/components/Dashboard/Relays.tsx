import getSettingsLayout from '~/components/Settings/Layout'
import useConnectedRelays from '~/hooks/useConnectedRelays'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useState } from 'react'
import { Input } from '~/components/ui/input'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { XCircle } from 'lucide-react'
import { PlusCircle } from 'lucide-react'

const RECOMMENDED_RELAYS = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol']

export default function Relays() {
  const relays = useSettingsStore((state) => state.relays)
  const removeRelay = useSettingsStore((state) => state.removeRelay)
  const addRelayToSettings = useSettingsStore((state) => state.addRelay)
  const [newRelay, setNewRelay] = useState('')
  const connectedRelays = useConnectedRelays()

  const addRelay = (relayUrl: string) => {
    addRelayToSettings(relayUrl)
    setNewRelay('')
  }

  return (
    <div className="max-w-3xl space-y-6 px-8 pt-8">
      <h1 className="text-2xl font-bold">Relays</h1>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Add Custom Relay</h2>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter relay URL (wss://...)"
            value={newRelay}
            onChange={(e) => setNewRelay(e.target.value)}
            className="flex-grow"
            spellCheck="false"
          />
          <Button onClick={() => addRelay(newRelay)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Current Relays</h2>
        {relays.length === 0 ? (
          <p className="text-muted-foreground">No relays added yet.</p>
        ) : (
          <ul className="space-y-2">
            {relays.map((relay) => (
              <li key={relay} className="flex items-center justify-between rounded bg-secondary p-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{relay}</span>
                  {/* TODO: Refactor relay status. Add more info to relay (not just url string + connected) */}
                  {/* {relay.status === 'connecting' && <span className="text-sm text-yellow-500">Connecting...</span>} */}
                  {connectedRelays.has(relay) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {!connectedRelays.has(relay) && <XCircle className="h-4 w-4 text-red-500" />}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeRelay(relay)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Recommended Relays</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {RECOMMENDED_RELAYS.map((url) => (
            <Button
              key={url}
              variant="outline"
              className="justify-start"
              onClick={() => addRelay(url)}
              disabled={relays.some((relay) => relay === url)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {url}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
