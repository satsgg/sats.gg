export const Relay = ({ relay, connected }: { relay: string; connected: boolean }) => {
  return (
    <div className="flex grow gap-x-2 rounded border border-gray-500 bg-stone-800 p-2">
      <span>{connected ? '✅' : '❌'}</span>
      <span>{relay}</span>
    </div>
  )
}

export default Relay
