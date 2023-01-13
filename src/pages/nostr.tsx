import {
  relayInit,
  Relay,
  generatePrivateKey,
  getPublicKey,
  getEventHash,
  signEvent,
  Event as NostrEvent,
} from 'nostr-tools'
import { useRef, useEffect, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { uniqBy } from '~/utils/nostr'

const relayUrls = [
  'wss://brb.io',
  'wss://relay.damus.io',
  'wss://nostr-relay.wlvs.space',
  'wss://nostr.fmt.wiz.biz',
  'wss://nostr.oxtr.dev',
]

const eventOrder = {
  created_at: null,
  content: null,
}

export default function Nostr() {
  const [events, setEvents] = useState<NostrEvent[]>([])
  const [connectedRelays, setConnectedRelays] = useState<Relay[]>([])
  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered
  const isFirstRender = useRef(true)

  const uniqEvents = events.length > 0 ? uniqBy(events, 'id') : []
  // currently seems unnecessary?
  // const sortedEvents = uniqEvents.sort((a, b) => b.created_at - a.created_at)

  const formatContent = (content: string) => {
    return content.slice(0, 120)
  }

  const connectToRelays = async () => {
    relayUrls.forEach(async (relayUrl) => {
      const relay = relayInit(relayUrl)
      try {
        await relay.connect()
      } catch (e) {
        console.error('Error connecting to relay:', e)
      }

      relay.on('connect', () => {
        console.log(`✅ nostr (${relayUrl}): Connected!`)
        setConnectedRelays((prev) => [...prev, relay])
      })

      relay.on('disconnect', () => {
        console.warn(`🚪 nostr (${relayUrl}): Connection closed.`)
        setConnectedRelays((prev) => prev.filter((r) => r.url !== relayUrl))
      })

      relay.on('error', () => {
        console.log(`❌ nostr (${relayUrl}): Connection error!`)
      })

      let sub = relay.sub([
        {
          kinds: [1],
          since: now.current,
        },
      ])

      sub.on('event', (event: NostrEvent) => {
        // console.log(`⬇️ nostr (${relay.url}): Received event:`, event)
        // const addObjectResource = Object.assign(objectOrder, addObjectResource);
        console.log(`⬇️ nostr (${relay.url}): Received event:`, Object.assign(eventOrder, event))

        setEvents((_events) => {
          // need to only add event if the event id is unique
          return [..._events, event]
        })
      })
    })
  }

  // useEffect(() => {
  //   connectToRelays()
  // }, [])

  useEffect(() => {
    // Make sure we only start the relays once (even in strict-mode)
    if (isFirstRender.current) {
      isFirstRender.current = false
      connectToRelays()
    } else {
      console.log('is NOT first render... skipping connecting again')
    }
  }, [])

  const createNostrChannel = () => {
    const event: NostrEvent = {
      kind: 40,
      // pubkey: '8757042284f4f36d32ac7f15011213a79a2bc72b8bb1981cb7d8a0a845271e2b',
      pubkey: '25e5c82273a271cb1a840d0060391a0bf4965cafeb029d5ab55350b418953fbb',
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify({
        name: 'chadtestchannel' + Math.floor(Math.random() * 10000),
        about: 'test',
        picture: 'https://picsum.photos/200',
      }),
      // content: 'name: chadtestchannel, about: test, picture: https://picsum.photos/200'
    }

    event.id = getEventHash(event)
    event.sig = signEvent(event, '366f8ea72b09068ed3041a2fccae2192598e6e0c160f1422570f0911cc23dc51')
    console.log('publishing event: ', event)
    connectedRelays.forEach((relay) => {
      let pub = relay?.publish(event)
      pub?.on('ok', () => {
        console.log(`${relay.url} has accepted our event`)
      })
      pub?.on('seen', () => {
        console.log(`we saw the event on ${relay.url}`)
      })
      pub?.on('failed', (reason) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`)
      })
    })
  }

  const publishChannelEvent = () => {
    const event: NostrEvent = {
      kind: 42,
      pubkey: '8757042284f4f36d32ac7f15011213a79a2bc72b8bb1981cb7d8a0a845271e2b',
      created_at: Math.floor(Date.now() / 1000),
      tags: [['e', 'c86f570468bebe5f864505654bd34ea71ea645ae43c06a1573039087cd7d624f']],
      content: 'what client are you using?',
    }

    event.id = getEventHash(event)
    event.sig = signEvent(event, '366f8ea72b09068ed3041a2fccae2192598e6e0c160f1422570f0911cc23dc51')
    console.log('publishing event: ', event)
    connectedRelays.forEach((relay) => {
      let pub = relay?.publish(event)
      pub?.on('ok', () => {
        console.log(`${relay.url} has accepted our event`)
      })
      pub?.on('seen', () => {
        console.log(`we saw the event on ${relay.url}`)
      })
      pub?.on('failed', (reason) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`)
      })
    })
  }

  // const publishEvent = () => {
  //   const event: NostrEvent = {
  //     kind: 1,
  //     pubkey: 'c5fad3e9e99f5792eba9389e25e12ce115f0cdeb99d8d605da29829e17e9fc42',
  //     created_at: Math.floor(Date.now() / 1000),
  //     tags: [],
  //     content: 'hello world'
  //   }

  //   event.id = getEventHash(event)
  //   event.sig = signEvent(event, '74e0bd7b8a347f9c3541425c77b92064fd96142479ad60b0553adb38633c6423')
  //   console.log('publishing event: ', event)
  //   let pub = connectedRelay?.publish(event)
  //   pub?.on('ok', () => {
  //     console.log(`${relayUrl} has accepted our event`)
  //   })
  //   pub?.on('seen', () => {
  //     console.log(`we saw the event on ${relayUrl}`)
  //   })
  //   pub?.on('failed', reason => {
  //     console.log(`failed to publish to ${relayUrl}: ${reason}`)
  //   })
  // }

  return (
    <div className="w-max-full flex grow flex-col border-l border-solid border-gray-500 bg-stone-800">
      <div className="flex justify-center border-b border-solid border-gray-500">
        <p className="py-2 px-4 font-normal text-white">CHAT</p>
      </div>
      <Virtuoso
        data={uniqEvents}
        followOutput={'auto'}
        itemContent={(index, event) => {
          return (
            <div className="break-words px-3">
              <span className="text-sm text-white">{event.pubkey.slice(0, 12)}</span>
              <span className="text-sm text-white">: </span>
              <span className="text-sm text-gray-300">{event.content}</span>
            </div>
          )
        }}
      />
      {/* <button onClick={() => publishEvent()} >Click </button> */}
      <button onClick={createNostrChannel}>Create Channel</button>
      <button onClick={publishChannelEvent}>Publish channel event</button>
    </div>
  )
}
