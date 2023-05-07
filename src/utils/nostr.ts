import { getEventHash, signEvent, verifySignature, Event as NostrEvent, nip19 } from 'nostr-tools'
import { UserMetadata } from '~/nostr/NostrClient'

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

// TODO: Make all of these functions better and more consistent

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

export const createChannelEvent = (pubkey: string, name: string, about: string, picture: string) => {
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

export const updateChannelEvent = (
  pubkey: string,
  chatChannelId: string,
  name: string,
  about: string,
  picture: string,
) => {
  const content = JSON.stringify({
    name: name,
    about: about,
    picture: picture,
  })

  const event: NostrEvent = {
    kind: 41,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['e', chatChannelId]],
    content: content,
  }

  console.debug('updateChannelEvent', event)
  return event
}

export const signAuthEvent = async (pubkey: string, challenge: string) => {
  const content = {
    challenge: challenge,
    message: 'Sign this event to authenticate with sats.gg. This event will not be published.',
  }
  const event: NostrEvent = {
    kind: -1,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [[]],
    content: JSON.stringify(content),
  }

  return await window.nostr.signEvent(event)
}

export const displayName = (pubkey: string, profile: UserMetadata | undefined) => {
  if (profile?.name) {
    return profile.name
  } else if (profile?.display_name) {
    return profile.display_name
  } else {
    return nip19.npubEncode(pubkey)
  }
}
