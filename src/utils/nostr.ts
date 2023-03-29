import { getEventHash, signEvent, verifySignature, Event as NostrEvent } from 'nostr-tools'

// export const unique = <T extends { [key: string]: unknown }>(arr: T[], key: string): T[] => [   ...new Map(arr.map((item: T) => [item[key], item])).values() ];
export const uniqBy = <T>(arr: T[], key: keyof T): T[] => {
  return Object.values(
    arr.reduce(
      (map, item) => ({
        ...map,
        [`${item[key]}`]: item,
      }),
      {},
    ),
  )
}

// const pubKey = '8757042284f4f36d32ac7f15011213a79a2bc72b8bb1981cb7d8a0a845271e2b'
// const privKey = '366f8ea72b09068ed3041a2fccae2192598e6e0c160f1422570f0911cc23dc51'

export const createEvent = (pubkey: string, content: string, channelId: string): NostrEvent => {
  // Can generalize later... (if kind 42, add e channelID tag etc)
  const event: NostrEvent = {
    kind: 42,
    // kind: 1,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['e', channelId]],
    // tags: [[]],
    content: content,
  }

  // event.id = getEventHash(event)
  // event.sig = signEvent(event, privKey)

  return event
}

export const createChannelEvent = (pubkey: string, name: string, picture: string, about: string) => {
  const content = JSON.stringify({
    name: name,
    about: about,
    picture: picture,
  })

  const event: NostrEvent = {
    kind: 40,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    // tags: [['e', channelId]],
    tags: [],
    content: content,
  }

  console.debug('createChannelEvent', event)
  return event
}

export const signAuth = async (pubkey: string) => {
  const event: NostrEvent = {
    kind: 1,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [[]],
    content: 'Sign this event to authenticate with sats.gg. This event will not be published.',
  }

  return await window.nostr.signEvent(event)
}
