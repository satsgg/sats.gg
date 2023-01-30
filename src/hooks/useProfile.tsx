import { useEffect, useState, useMemo } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import { db } from '~/store/db'
import { useLiveQuery } from 'dexie-react-hooks'

interface Metadata {
  pubkey: string
  name?: string
  display_name?: string
  picture?: string
  about?: string
  website?: string
  lud06?: string
  lud16?: string
  nip06?: string
}

// {display_name: 'Edward Snowden', name: 'Snowden', picture: 'https://nostr.build/i/p/6838p.jpeg', banner: 'https://nostr.build/i/6843.jpeg', about: 'Bio: I used to work for the government. Now I work…macmillan.com/books/9781250237231/permanentrecord', …}
// about: "Bio: I used to work for the government. Now I work for the public. Author, \"Permanent Record\": https://us.macmillan.com/books/9781250237231/permanentrecord"
// banner: "https://nostr.build/i/6843.jp"
// display_name: "Edward Snowden"
// lud16: "snowden@getalby.com"
// name: "Snowden"
// nip05 : "Snowden@Nostr-Check.com"
// picture : "https://nostr.build/i/p/6838p.jpeg"
// website : "edwardsnowden.substack.com"

export const useProfile = (pubkey: string) => {
  const profile = useLiveQuery(async () => {
    if (pubkey) {
      const ret = await db.users.get(pubkey)
      // logging multiple times b/c each callback is updated the store?
      // would need a quick returning relaypool sub (promise based, exit on first response)
      if (ret) return ret
      // negatives with this method is that querying is after first db check
      // it will also query for pubkeys w/out nip05s forever
      // else nostrClient.addProfileToFetch(pubkey)
    }
  }, [pubkey])

  useEffect(() => {
    if (pubkey) {
      nostrClient.addProfileToFetch(pubkey)
      return () => {
        nostrClient.removeProfileToFetch(pubkey)
      }
    }
  }, [pubkey])

  return profile
}
