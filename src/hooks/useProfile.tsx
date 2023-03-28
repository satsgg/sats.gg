import { nostrClient } from '~/nostr/NostrClient'
import { db } from '~/store/db'
import { useLiveQuery } from 'dexie-react-hooks'

// refetch profiles after 1 day
const profileCacheDuration = 86400

export const useProfile = (pubkey: string | undefined) => {
  const [profile, isLoading] = useLiveQuery(
    async () => {
      if (!pubkey) return [undefined, false]
      const ret = await db.users.get(pubkey)

      if (ret) {
        // refetch profile if it's been a while
        const now = Math.floor(Date.now() / 1000)
        if (ret.updated_at + profileCacheDuration < now) {
          ret.updated_at = now
          await db.users.put(ret)
          nostrClient.addProfileToFetch(pubkey)
        }

        return [ret, false]
      }

      nostrClient.addProfileToFetch(pubkey)
      return [undefined, false]
    },
    [pubkey],
    [undefined, true],
  )

  return { profile, isLoading }
}
