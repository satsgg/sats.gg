import { bech32 } from '@scure/base'
import { UnsignedEvent, Event as NostrEvent, nip19, nip57, utils, validateEvent, verifySignature } from 'nostr-tools'
import { utf8Decoder } from 'nostr-tools/lib/utils'
import { UserMetadata } from '~/nostr/NostrClient'
import { UserMetadataStore } from '~/store/db'

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

export const createEvent = (pubkey: string, content: string, channelId: string): UnsignedEvent => {
  // Can generalize later... (if kind 42, add e channelID tag etc)
  const event: UnsignedEvent = {
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

  const event: UnsignedEvent = {
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

  const event: UnsignedEvent = {
    kind: 41,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['e', chatChannelId]],
    content: content,
  }

  console.debug('updateChannelEvent', event)
  return event
}

// TODO: Nip 42 kind 22242
export const signAuthEvent = async (pubkey: string, challenge: string) => {
  const content = {
    challenge: challenge,
    message: 'Sign this event to authenticate with sats.gg. This event will not be published.',
  }
  const event: UnsignedEvent = {
    // TODO: Kind 255? Blank nostr-tools?
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

// had to replace nostr-tools with this to support UserMetadataStore...
export async function getZapEndpoint(
  profile: UserMetadataStore,
): Promise<null | { callback: string; minSendable: number; maxSendable: number; nostrPubkey: string; lnurl: string }> {
  try {
    let lnurl: string = ''
    let { lud06, lud16 } = profile
    if (lud06) {
      let { words } = bech32.decode(lud06, 1000)
      let data = bech32.fromWords(words)
      lnurl = utils.utf8Decoder.decode(data)
    } else if (lud16) {
      let [name, domain] = lud16.split('@')
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`
    } else {
      return null
    }

    let res = await fetch(lnurl)
    let body = await res.json()

    // TODO: validate body key values?
    if (body.allowsNostr && body.nostrPubkey) {
      return {
        callback: body.callback,
        minSendable: body.minSendable,
        maxSendable: body.maxSendable,
        nostrPubkey: body.nostrPubkey,
        lnurl: lnurl,
      }
    }
  } catch (err) {
    /*-*/
  }

  return null
}

type ZapRequestArgs = {
  profile: string
  event: string | null
  amount: number
  comment: string
  relays: string[]
}

export async function createZapEvent(zapRequestArgs: ZapRequestArgs) {
  try {
    const zapRequestEvent = nip57.makeZapRequest(zapRequestArgs)
    const signedZapRequestEvent: NostrEvent = await window.nostr.signEvent(zapRequestEvent)

    let ok = validateEvent(signedZapRequestEvent)
    if (!ok) throw new Error('Invalid event')

    console.debug('signedZapRequestEvent', signedZapRequestEvent)
    let veryOk = verifySignature(signedZapRequestEvent)
    if (!veryOk) throw new Error('Invalid signature')

    return signedZapRequestEvent
  } catch (e: any) {
    console.error(e)
  }

  return null
}

export async function requestZapInvoice(
  signedZapRequestEvent: NostrEvent,
  amount: number,
  callback: string,
  lnurl: string,
) {
  try {
    const encodedZapRequest = encodeURI(JSON.stringify(signedZapRequestEvent))
    const zapRequestHttp = `${callback}?amount=${amount}&nostr=${encodedZapRequest}&lnurl=${lnurl}`
    console.debug('zapRequestHttp', zapRequestHttp)

    const resObj = await fetch(zapRequestHttp).then((res) => res.json())

    console.debug('resObj', resObj)
    if (resObj.status === 'ERROR') throw new Error(resObj.reason)

    const { pr: invoice } = resObj
    console.log('Success! Invoice: ', invoice)

    return invoice
  } catch (e: any) {
    console.error(e)
  }

  return null
}
