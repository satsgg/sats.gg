import RelayPool from './RelayPool'
import { Filter, Event, nip19 } from 'nostr-tools'
import Settings from '~/store/settingsStore'
import { db } from '~/store/db'
import { Event as NostrEvent } from 'nostr-tools'

// TODO: Move interfaces to nostr/index.ts
export interface UserMetadata {
  name?: string
  display_name?: string
  picture?: string
  about?: string
  website?: string
  banner?: string
  lud06?: string
  lud16?: string
  nip05?: string
}

export type UserMetadataStore = UserMetadata & {
  pubkey: string
  npub: string
  created_at: number
  updated_at: number
}

class NostrClient {
  relayPool: RelayPool = new RelayPool()
  profileQueue: Set<string> = new Set() // set of hex public keys to query
  paused: boolean = false

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

  connect() {
    const relays = Settings.getState().relays
    console.debug('NostrClient.connect relays: ', relays)
    relays.forEach((relay) => {
      console.log('connect', relay)
      this.relayPool.connectToRelay(relay)
    })
  }

  disconnect() {
    const relays = Settings.getState().relays
    console.debug('disconnect', relays)
    relays.forEach((relay) => {
      console.log('connect', relay)
      this.relayPool.disconnectFromRelay(relay)
    })
  }

  connectToRelay(url: string) {
    this.relayPool.connectToRelay(url)
  }

  disconnectFromRelay(url: string) {
    this.relayPool.disconnectFromRelay(url)
  }

  addRelay(url: string) {
    this.relayPool.addRelay(url)
  }

  removeRelay(url: string) {
    this.relayPool.removeRelay(url)
  }

  subscribe(id: string, filters: Filter[], eventCb: (event: Event) => void) {
    this.relayPool.addSubscription(id, filters, eventCb)
  }

  unsubscribe(id: string) {
    this.relayPool.removeSubscription(id)
  }

  addProfileToFetch(pubkey: string) {
    this.profileQueue.add(pubkey)
    this._fetchPubkeys()
  }

  removeProfileToFetch(pubkey: string) {
    this.profileQueue.delete(pubkey)
  }

  _fetchPubkeys() {
    if (this.paused || this.profileQueue.size === 0) return

    const filters: Filter[] = [
      {
        kinds: [0],
        authors: Array.from(this.profileQueue),
      },
    ]
    console.log('subscribing for pubkeys: ', Array.from(this.profileQueue))

    const callback = async (event: Event) => {
      const profile: UserMetadata = JSON.parse(event.content)
      const profileToStore: UserMetadataStore = {
        ...profile,
        pubkey: event.pubkey,
        npub: nip19.npubEncode(event.pubkey),
        created_at: event.created_at,
        updated_at: Math.floor(Date.now() / 1000),
      }

      // only keep the newest profile event stored
      const existingProfile = await db.users.get(profileToStore.pubkey)
      if (!existingProfile || profileToStore.created_at > existingProfile.created_at) {
        await db.users.put(profileToStore)
      }
    }

    // fetch with promises? want to close this.unsubscribe() when one relay returns info...
    this.subscribe('profiles', filters, callback)
    for (let pubkey of this.profileQueue) {
      this.profileQueue.delete(pubkey)
    }

    this.paused = true
    setTimeout(() => {
      this.paused = false
      this._fetchPubkeys()
    }, 500)
  }

  async publish(event: NostrEvent) {
    await this.relayPool.publish(event)
  }
}

export const nostrClient = new NostrClient()
