import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { relayInit, Relay, Event as NostrEvent } from 'nostr-tools'

type NostrContextType = {
  connectedRelays: Relay[]
  publish: (event: NostrEvent) => void
}

const NostrContext = createContext<NostrContextType>({
  connectedRelays: [],
  publish: () => null,
})

export function NostrProvider({
  children,
  relayUrls,
  debug,
}: {
  children: ReactNode
  relayUrls: string[]
  debug?: boolean
}) {
  const [connectedRelays, setConnectedRelays] = useState<Relay[]>([])
  const isFirstRender = useRef(true)

  const connectToRelays = async () => {
    // const connectToRelays = useCallback(() => {
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
    })
  }

  useEffect(() => {
    // Make sure we only start the relays once (even in strict-mode)
    if (isFirstRender.current) {
      isFirstRender.current = false
      connectToRelays()
    } else {
      console.log('is NOT first render... skipping connecting again')
    }
  }, [])

  // want to return each of these functions instead of just running them here...
  // can't tell in consuming component the results of any of these
  const publish = (event: NostrEvent) => {
    console.log('publishing event: ', event)

    connectedRelays.forEach((relay) => {
      let pub = relay?.publish(event)
      pub?.on('ok', () => {
        console.log(`${relay.url} has accepted our event`)
      })
      pub?.on('seen', () => {
        console.log(`we saw the event on ${relay.url}`)
      })
      pub?.on('failed', (reason: any) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`)
      })
    })
  }

  const value: NostrContextType = {
    connectedRelays,
    publish,
  }

  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
}

export function useNostr() {
  return useContext(NostrContext)
}
