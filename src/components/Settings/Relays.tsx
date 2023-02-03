import useSettingsStore from "~/hooks/useSettingsStore"

const Relay = ({ relay }: {relay: string}) => {
  return (
    <div className="p-2 border rounded border-gray-500 bg-stone-800">
      <p>{relay}</p>
    </div>
  ) 
}

const Relays = () => {
  const settings = useSettingsStore()
  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md mb-2 text-xl">Relays</h2>
      {/* <div className="flex w-3/5 flex-col gap-4"> */}
        {Array.from(settings.relays).map(relay => {
          // return <p key={relay}>{relay}</p>
          return <Relay key={relay} relay={relay} />
        })}
      {/* </div> */}
    </div>
  )
}

export default Relays
