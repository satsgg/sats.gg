import RelayPool from './RelayPool'
import { Filter, Event } from 'nostr-tools'
import Settings from '~/store/userSettingsStore'

// export default class NostrClient {
class NostrClient {
  relayPool: RelayPool

  // want to initiate this client with relays from the user's settings
  // so want a store for user settings
  // if no user settings set to default list of relays
  // constructor needs to run after user settings store is initiated.

  // NostrStore
  //  - user settings store slice
  //    * relays
  //    * public/private key
  //  - events/notes store?
  //    * profiles
  //    * following list
  // - NostrClient
  //    * client saved in top level NostrStore
  //    * initiated after user settings slice

  constructor(relays: string[]) {
    this.relayPool = new RelayPool(relays)
  }

  connect() {
    this.relayPool.connect()
  }

  subscribe(id: string, filters: Filter[], eventCb: (event: Event) => void) {
    this.relayPool.addSubscription(id, filters, eventCb)
  }

  unsubscribe(id: string) {
    console.log('unsubscribing')
    this.relayPool.removeSubscription(id)
  }

  publish() {}
}

// NOTE: This might stop working once we start reading relays from localStorage (async?)
// could become a race condition...
// could just initialize settings store and then initialize nostr client
// during useEffect in DefaultLayout
export const nostrClient = new NostrClient(Settings.getState().relays)
