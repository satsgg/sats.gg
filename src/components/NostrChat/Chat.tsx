import { useRef, useState, useEffect } from 'react'
import { Virtuoso, LogLevel, VirtuosoHandle } from 'react-virtuoso'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { useNostr } from '~/context/nostr'
import { Filter, Event as NostrEvent } from 'nostr-tools'
import { createEvent, uniqBy } from '~/utils/nostr'
import MessageInput from './MessageInput'
import ChatUser from './ChatUser'
import Message from './Message'
import { useSubscription } from '~/hooks/useSubscription'
import { usePopper } from 'react-popper'

const eventOrder = {
  created_at: null,
  content: null,
}

type UserSingleOutput = inferProcedureOutput<AppRouter['user']['getUser']>
interface ChannelUserProps {
  channelUser: UserSingleOutput
}

export const Chat = ({ channelUser }: ChannelUserProps) => {
  const { publish } = useNostr()
  const [message, setMessage] = useState<string>('')
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [chatRef, setChatRef] = useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const { styles, attributes } = usePopper(chatRef, popperElement, {
    placement: 'top',
  })

  const [showBottomButton, setShowBottomButton] = useState(false)
  const [atBottom, setAtBottom] = useState(false)
  const showButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered

  const filters: Filter[] = [
    {
      // kinds: [42],
      kinds: [1],
      since: now.current,
      // '#e': [channelId],
    },
    {
      kinds: [42],
      since: now.current,
    },
  ]
  const notes = useSubscription(channelUser.id, filters, 250)

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

  useEffect(() => {
    return () => {
      if (showButtonTimeoutRef.current) {
        clearTimeout(showButtonTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (showButtonTimeoutRef.current) {
      clearTimeout(showButtonTimeoutRef.current)
    }
    if (!atBottom) {
      showButtonTimeoutRef.current = setTimeout(() => setShowBottomButton(true), 100)
    } else {
      setShowBottomButton(false)
    }
  }, [atBottom, setShowBottomButton])

  // const uniqEvents = events.length > 0 ? uniqBy(events, 'id') : []

  return (
    <div className="w-max-full flex grow flex-col border-l border-solid border-gray-500 bg-stone-800">
      <div className="flex justify-center border-b border-solid border-gray-500">
        <p className="py-2 px-4 font-normal text-white">CHAT</p>
      </div>
      <Virtuoso
        // logLevel={LogLevel.DEBUG}
        data={notes}
        followOutput
        // followOutput={'smooth'}
        ref={virtuosoRef}
        className={'max-h-[calc(100vh-13rem)]'}
        // not sure on these pixel calcs, but 1000px bottom seems to have *improved*
        // the scrollToBottom issue as recommended by virtuoso guy.
        increaseViewportBy={{
          top: 200,
          bottom: 2000
        }}
        atBottomStateChange={(bottom) => {
          if (!bottom) console.warn('NOT AT BOTTOM')
          setAtBottom(bottom)
        }}
        itemContent={(index, note) => {
          return (
            <div className="break-words px-3">
              <ChatUser pubkey={note.pubkey} />
              {/* <span>{note.pubkey.slice(0,12)}</span> */}
              <span className="text-sm text-white">: </span>
              {/* <span className="text-sm ">{note.content}</span> */}
              <Message content={note.content} />
            </div>
          )
        }}
      />

      {showBottomButton && (
        <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
          <button
            className="bg-slate-600 px-2 py-1"
            onClick={() => virtuosoRef.current?.scrollToIndex({ index: notes.length - 1, behavior: 'auto' })}
          >
            Scroll to bottom
          </button>
        </div>
      )}

      <div ref={setChatRef} className="flex w-full flex-col gap-3 py-3 px-3">
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
