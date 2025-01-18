import { bech32 } from '@scure/base'
import {
  UnsignedEvent,
  Event as NostrEvent,
  nip19,
  nip57,
  utils,
  validateEvent,
  verifySignature,
  getEventHash,
  // TODO: Update nostr-tools
  signEvent, // replace with getSignature in newer nostr-tools
  getPublicKey,
  EventTemplate,
} from 'nostr-tools'
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

export const createChatEvent = (content: string, pubkey: string, d: string): EventTemplate => {
  const event: EventTemplate = {
    kind: 1311,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['a', `30311:${pubkey}:${d}`]],
    content: content,
  }
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

export const createStreamEvent = (pubkey: string, id: string, now: number, status: 'planned' | 'live' | 'ended') => {
  // const now = Math.floor(Date.now() / 1000)

  const streamingUrl = `https://d1994e6vyyhuyl.cloudfront.net/${id}/stream.m3u8`
  let event: UnsignedEvent = {
    kind: 30311,
    pubkey: pubkey,
    created_at: now,
    tags: [
      ['d', id],
      ['title', 'Testing l402-hls'],
      ['summary', 'Just testing this'],
      ['streaming', streamingUrl],
      ['image', 'https://cryptoevents.global/wp-content/uploads/ATL-BitLab.jpg'],
      // ['starts', now.toString()],
      ['status', status],
      ['current_participants', '1'],
      ['t', 'Test'],
      ['t', 'l402-hls'],
      // ['p', ''],
      ['relays', 'ws://localhost:7777'],
    ],
    content: '',
  }

  if (status === 'live') {
    event.tags.push(['starts', now.toString()])
  } else {
    event.tags.push(['ends', now.toString()])
  }

  return event
}

export const signEventPrivkey = (event: EventTemplate, privKey: string | undefined) => {
  if (!privKey) return null
  try {
    const unsignedEvent: UnsignedEvent = {
      ...event,
      pubkey: getPublicKey(privKey),
    }

    const signedEvent = {
      ...unsignedEvent,
      id: getEventHash(unsignedEvent),
      sig: signEvent(unsignedEvent, privKey),
    }

    return signedEvent
  } catch (err: any) {
    console.error(err)
  }

  return null
}

export const signAuthEvent = async (pubkey: string, challenge: string) => {
  // const content = {
  //   challenge: challenge,
  //   message: 'Sign this event to authenticate with sats.gg. This event will not be published.',
  // }

  const event: UnsignedEvent = {
    kind: 27235,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', 'https://sats.gg/api/trpc/auth.login'],
      ['method', 'POST'],
      ['payload', challenge],
    ],
    // content: JSON.stringify(content),
    content: '',
  }
  console.debug('signed event', event)

  return await window.nostr.signEvent(event)
}

export const displayName = (pubkey: string, profile: UserMetadata | undefined) => {
  if (profile?.display_name) {
    return profile.display_name
  } else if (profile?.name) {
    return profile.name
  } else if (profile?.nip05) {
    return profile.nip05.substring(0, profile.nip05.indexOf('@'))
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

export type ZapRequestArgs = {
  profile: string
  event: string | null
  amount: number
  comment: string
  relays: string[]
}

export async function createZapEvent(
  zapRequestArgs: ZapRequestArgs,
  channelPubkey: string,
  channelIdentifier: string,
  privKey: string | null = null,
) {
  try {
    const zapRequestEvent = nip57.makeZapRequest(zapRequestArgs)
    zapRequestEvent.tags.push(['a', `30311:${channelPubkey}:${channelIdentifier}`])
    let signedZapRequestEvent: NostrEvent | null = null

    if (privKey) {
      signedZapRequestEvent = signEventPrivkey(zapRequestEvent, privKey)
    } else {
      signedZapRequestEvent = await window.nostr.signEvent(zapRequestEvent)
    }

    if (!signedZapRequestEvent) throw new Error('Failed to sign event')

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

export const getVerifiedChannelLink = (profile: UserMetadataStore | undefined) => {
  if (profile?.nip05) {
    const match = profile.nip05.match(/^(?:([\w.+-]+)@)?([\w.-]+)$/)
    if (!match) return null
    const [_, name = '_', domain] = match
    if (domain === 'sats.gg') return name
  }

  return null
}

export const validNpubKey = (npub: string) => {
  try {
    if (npub.length !== 63) throw new Error('Invalid npub key length')

    let { type, data: nipData } = nip19.decode(npub)
    if (type !== 'npub') throw new Error('Invalid npub key')
  } catch (error) {
    console.error(error)
    return false
  }

  return true
}

export const validHexKey = (hexKey: string) => {
  try {
    if (!hexKey.match(/^[a-f0-9]{64}$/)) {
      throw new Error('Invalid hex public key')
    }
    let npub = nip19.npubEncode(hexKey)
    let { type, data: nipData } = nip19.decode(npub)
    if (type !== 'npub') {
      throw new Error('Invalid hex public key')
    }
  } catch (error) {
    console.error(error)
    return false
  }

  return true
}

export const getZapAmountFromReceipt = (zapReceipt: NostrEvent<9735>) => {
  const bolt11 = zapReceipt.tags.find((t) => t[0] == 'bolt11')
  if (!bolt11 || !bolt11[1]) return null

  const decoded = require('light-bolt11-decoder').decode(bolt11[1])
  const index = decoded.sections.findIndex((s: any) => s.name === 'amount')

  const amount = parseInt(decoded.sections[index].value) / 1000

  return amount
}

export type ZapRequest = {
  pubkey: string
  created_at: number
  id: string
  sig: string
  content: string
  // tags
  relays?: string[]
  amount?: string
  lnurl?: string
  p: string
  e?: string
  a?: string
}

export const parseZapRequest = (zapRequest: NostrEvent<9734>): ZapRequest | null => {
  try {
    const pTag = zapRequest.tags.find(([t, v]) => t === 'p' && v)
    if (!pTag || !pTag[1]) return null

    let parsedZapRequest: ZapRequest = {
      pubkey: zapRequest.pubkey,
      created_at: zapRequest.created_at,
      id: zapRequest.id,
      sig: zapRequest.sig,
      content: zapRequest.content,
      p: pTag[1],
    }

    const relays = zapRequest.tags.find(([t, v]) => t === 'relays' && v)
    if (relays && relays[1]) parsedZapRequest['relays'] = relays.splice(1)

    const amount = zapRequest.tags.find(([t, v]) => t === 'amount' && v)
    if (amount && amount[1]) parsedZapRequest['amount'] = amount[1]

    const lnurl = zapRequest.tags.find(([t, v]) => t === 'lnurl' && v)
    if (lnurl && lnurl[1]) parsedZapRequest['lnurl'] = lnurl[1]

    const e = zapRequest.tags.find(([t, v]) => t === 'e' && v)
    if (e && e[1]) parsedZapRequest['e'] = e[1]

    const a = zapRequest.tags.find(([t, v]) => t === 'a' && v)
    if (a && a[1]) parsedZapRequest['a'] = a[1]

    return parsedZapRequest
  } catch (e) {
    console.error('Invalid zap request event')
  }

  return null
}

// export type AddressPointer = {
//   identifier: string
//   pubkey: string
//   kind: number
//   relays?: string[]
// }

export const getStreamNaddr = (pubkey: string, identifier: string, relays?: string[]) => {
  const addressPointer = {
    identifier: identifier,
    pubkey: pubkey,
    kind: 30331,
    relays: relays,
  }
  return nip19.naddrEncode(addressPointer)
}

export type Participant = {
  pubkey: string
  relay?: string
  role?: string
  proof?: string
}

export type Stream = {
  pubkey: string
  providerPubkey?: string
  createdAt: number
  id: string
  sig: string
  // tags
  d: string // unique identifier
  title?: string
  summary?: string // description
  image?: string
  // empty array instead of undefined?
  t?: string[] // hashtag
  streaming?: string // rtmp url
  recording?: string // used to place the edited video once the activity is over
  starts?: string // unix timestamp
  ends?: string // unix timestamp
  status?: 'planned' | 'live' | 'ended'
  currentParticipants?: number
  totalParticipants?: number
  // empty arrays instead of undefined?
  p?: string[] // participants
  relays?: string[]
}

// TODO: Can't expect properly formatted notes and types
// check types?
export const parseStreamNote = (note: NostrEvent): Stream | null => {
  let d = note.tags.find(([t, v]) => t === 'd' && v)
  if (!d || !d[1]) return null
  const identifier = d[1]

  const stream: Stream = {
    pubkey: note.pubkey,
    createdAt: note.created_at,
    id: note.id,
    sig: note.sig,
    d: identifier,
  }
  // let d = note.tags.find(([t, v]) => t === 'd' && v)
  // if (d && d[1]) stream['d'] = d[1]
  // else return null
  // if no unique identifier, return null

  let title = note.tags.find(([t, v]) => t === 'title' && v)
  if (title && title[1]) stream['title'] = title[1]

  let summary = note.tags.find(([t, v]) => t === 'summary' && v)
  if (summary && summary[1]) stream['summary'] = summary[1]

  let image = note.tags.find(([t, v]) => t === 'image' && v)
  if (image && image[1]) stream['image'] = image[1]

  stream['t'] = note.tags.filter(([t, v]) => t === 't' && v).map(([_, v]) => v!)

  let streaming = note.tags.find(([t, v]) => t === 'streaming' && v)
  if (streaming && streaming[1]) stream['streaming'] = streaming[1]
  // if no url, return ull

  let recording = note.tags.find(([t, v]) => t === 'recording' && v)
  if (recording && recording[1]) stream['recording'] = recording[1]

  let starts = note.tags.find(([t, v]) => t === 'starts' && v)
  if (starts && starts[1]) stream['starts'] = starts[1]

  let ends = note.tags.find(([t, v]) => t === 'ends' && v)
  if (ends && ends[1]) stream['ends'] = ends[1]

  let status = note.tags.find(([t, v]) => t === 'status' && v)
  // if (status && status[1]) stream['status'] = status[1] as 'planned' | 'live' | 'ended'
  // else return null
  // if (stream['status'] !== 'live' && stream['status'] !== 'ended' && stream['status'] !== 'planned') return null

  if (status && status[1]) stream.status = status[1] as 'planned' | 'live' | 'ended'
  else return null
  if (stream.status !== 'live' && stream.status !== 'ended' && stream.status !== 'planned') return null

  let cp = note.tags.find(([t, v]) => t === 'current_participants' && v)
  if (cp && cp[1]) stream['currentParticipants'] = Number(cp[1])

  let tp = note.tags.find(([t, v]) => t === 'total_participants' && v)
  if (tp && tp[1]) stream['totalParticipants'] = Number(tp[1])

  // parse relays
  stream['relays'] = note.tags.find(([t]) => t === 'relays')?.[1]
    ? note.tags.find(([t]) => t === 'relays')!.slice(1)
    : undefined

  // TODO: Multiple participants, create participant type
  // let p = note.tags.find(([t, v]) => t === 'p' && v)
  // if (p && p[1]) stream['p'] = [p[1]]
  stream['p'] = note.tags.filter(([t, v]) => t === 'p' && v).map(([_, v]) => v!)

  return handleZapStream(stream)
}

const handleZapStream = (stream?: Stream) => {
  if (!stream) return null
  if (stream.pubkey !== 'cf45a6ba1363ad7ed213a078e710d24115ae721c9b47bd1ebf4458eaefb4c2a5') {
    return stream
  }
  if (!stream.p || !stream.p[0]) return stream
  const zapStream = { ...stream }
  zapStream.providerPubkey = stream.pubkey
  zapStream.pubkey = stream.p[0]
  zapStream.p = []
  return zapStream
}

export type Follows = {
  follows: string[]
  createdAt: number
}
