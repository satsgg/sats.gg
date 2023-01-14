import { useRef, useState, useEffect } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { useNostr } from '~/context/nostr'
import { Filter, Event as NostrEvent } from 'nostr-tools'
import { createEvent, uniqBy } from '~/utils/nostr'
import { MessageInput } from './MessageInput'
import { ChatUser } from './ChatUser'

const eventOrder = {
  created_at: null,
  content: null,
}

type OnEventFunc = (event: NostrEvent) => void

export const useNostrEvents = ({ filter }: { filter: Filter }) => {
  const { connectedRelays } = useNostr()
  const [events, setEvents] = useState<NostrEvent[]>([])
  let onEventCallback: null | OnEventFunc = null

  useEffect(() => {
    const subs = connectedRelays.map((relay) => {
      const sub = relay.sub([filter])
      console.log("new subscription! filter: ", filter)

      sub.on('event', (event: NostrEvent) => {
        // console.log(`⬇️ nostr (${relay.url}): Received event:`, Object.assign(eventOrder, event))
        onEventCallback?.(event)
        setEvents((_events) => {
          // limits since we are adding all events + duplicates?
          // currently filtering by unique before displaying
          return [..._events, event]
        })
      })

      sub.on('eose', (eose: any) => {
        console.log('eose: ', eose)
      })

      return sub
    })

    return () => {
      subs.forEach((sub) => {
        console.log('closing subscription! sub: ', sub)
        sub.unsub()
      })
    }
  }, [connectedRelays])

  const uniqEvents = events.length > 0 ? uniqBy(events, 'id') : []
  // const sortedEvents = uniqEvents.sort((a, b) => b.created_at - a.created_at)

  return {
    events: uniqEvents,
    onEvent: (_onEventCallback: OnEventFunc) => {
      if (_onEventCallback) {
        onEventCallback = _onEventCallback
      }
    }
  }
}

type UserSingleOutput = inferProcedureOutput<AppRouter['user']['getUser']>
interface ChannelUserProps {
  channelUser: UserSingleOutput
}

export const Chat = ({ channelUser }: ChannelUserProps) => {
  const { publish } = useNostr()
  const [message, setMessage] = useState<string>('')
  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered

  const filter: Filter = {
    // kinds: [42],
    kinds: [1],
    since: now.current,
    // '#e': [channelId],
  }
  const { events } = useNostrEvents({ filter })

  const handleSubmitMessage = (e: any) => {
    e.preventDefault()
    const formattedMessage = message.trim()
    if (formattedMessage === '') return

    const event: NostrEvent = createEvent(
      formattedMessage,
      '25e5c82273a271cb1a840d0060391a0bf4965cafeb029d5ab55350b418953fbb',
    )
    // error handling here? What if none of the relays accepted our message...
    publish(event)

    setMessage('')
    return
  }

  const uniqEvents = events.length > 0 ? uniqBy(events, 'id') : []

  return (
    <div className="w-max-full flex grow flex-col border-l border-solid border-gray-500 bg-stone-800">
      <div className="flex justify-center border-b border-solid border-gray-500">
        <p className="py-2 px-4 font-normal text-white">CHAT</p>
      </div>
      <Virtuoso
        data={uniqEvents}
        followOutput={'auto'}
        className={'max-h-[calc(100vh-12rem)]'}
        itemContent={(index, event) => {
          return (
            <div className="break-words px-3">
              {/* TODO: get user metadata before displaying pubkey */}
              {/* <span className="text-sm text-white">{event.pubkey.slice(0, 12)}</span> */}
              <ChatUser pubkey={event.pubkey} />
              <span className="text-sm text-white">: </span>
              <span className="text-sm text-gray-300">{event.content}</span>
            </div>
          )
        }}
      />
      <div className="flex w-full flex-col gap-3 py-3 px-3">
        <div>
          <MessageInput message={message} setMessage={setMessage} handleSubmitMessage={handleSubmitMessage} />
        </div>
        <div className="flex justify-end">
          <button
            className="inline-flex items-center rounded bg-primary px-3 py-2 text-sm font-semibold uppercase shadow-md transition duration-150 ease-in-out hover:bg-primary/80 hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg"
            // disabled={showTip}
            onClick={(e) => handleSubmitMessage(e)}
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  )
}
