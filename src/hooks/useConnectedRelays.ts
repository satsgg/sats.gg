import { useSyncExternalStore } from "react"
import { nostrClient } from "~/nostr/NostrClient"

const useConnectedRelays = () => {
  return useSyncExternalStore(
    nostrClient.relayPool.subscribe.bind(nostrClient.relayPool), 
    () => nostrClient.relayPool.connectedRelays,
    () => nostrClient.relayPool.connectedRelays 
  )
}

export default useConnectedRelays