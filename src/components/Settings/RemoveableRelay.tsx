import Relay from './Relay'

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

export default RemoveableRelay
