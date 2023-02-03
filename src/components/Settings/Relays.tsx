import useConnectedRelays from "~/hooks/useConnectedRelays"
import useSettingsStore from "~/hooks/useSettingsStore"

const Relay = ({ relay, connected }: {relay: string, connected: boolean}) => {
  return (
    <div className="p-2 border rounded border-gray-500 bg-stone-800">
      <span>{relay}: {connected ? "✅": "❌"}</span>
    </div>
  ) 
}

const Relays = () => {
  const relays = useSettingsStore((state) => state.relays)
  const connectedRelays = useConnectedRelays()

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md mb-2 text-xl">Relays</h2>
      {Array.from(relays).map(relay => {
        return <Relay key={relay} relay={relay} connected={connectedRelays.has(relay)}/>
      })}
    </div>
  )
}

export default Relays
