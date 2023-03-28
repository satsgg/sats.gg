import Dexie, { Table } from 'dexie'

export interface UserMetadataStore {
  name?: string
  pubkey?: string
  npub?: string
  display_name?: string
  picture?: string
  about?: string
  website?: string
  banner?: string
  lud06?: string
  lud16?: string
  nip05?: string
  created_at: number
  updated_at: number
}

export class DexieDB extends Dexie {
  users!: Table<UserMetadataStore>

  constructor() {
    super('DexieDB')
    //Writing this because there have been some issues on github where people index images or movies
    // without really understanding the purpose of indexing fields.
    // A rule of thumb: Are you going to put your property in a where(‘…’) clause?
    // If yes, index it, if not, dont. Large indexes will affect database performance and in
    // extreme cases make it unstable.
    // lud06: lnurl pay
    // lud16: lnaddr (might want to index)
    //  i.e. get all users where ln addr contains *@sats.gg? nip05 does same thing for verification
    this.version(1).stores({
      users: '++pubkey, name, npub', // Primary key and indexed props
    })
  }
}

export const db = new DexieDB()
