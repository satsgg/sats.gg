import { useRef, useState, useEffect } from 'react'
import { Virtuoso, LogLevel, VirtuosoHandle } from 'react-virtuoso'
import { inferProcedureOutput } from '@trpc/server'
// import { useNostr } from '~/context/nostr'
import { Filter, Event as NostrEvent } from 'nostr-tools'
import { createEvent, uniqBy } from '~/utils/nostr'
import MessageInput from './MessageInput'
import ChatUser from './ChatUser'
import Message from './Message'
import { useSubscription } from '~/hooks/useSubscription'
import { usePopper } from 'react-popper'
import useCanSign from '~/hooks/useCanSign'
import { verifySignature, validateEvent } from 'nostr-tools'
import { toast } from 'react-toastify'
import { nostrClient } from '~/nostr/NostrClient'
import useAuthStore from '~/hooks/useAuthStore'

const eventOrder = {
  created_at: null,
  content: null,
}

export const Chat = ({ channelPubkey }: { channelPubkey: string }) => {
  // const { publish } = useNostr()
  const pubkey = useAuthStore((state) => state.pubkey)
  const [message, setMessage] = useState<string>('')
  const canSign = useCanSign()

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
      kinds: [42],
      // kinds: [1],
      since: now.current,
      // TODO: use chat channel ID corresponding to channelPubkey
      '#e': ['cb1a5b962701e2c44a7bcf18fb3a60cbc8caec576c776749507acc952df97fcd'],
    },
  ]
  const notes = useSubscription(channelPubkey, filters, 250)

  const handleSubmitMessage = async (e: any) => {
    e.preventDefault()
    if (!pubkey) return

    const formattedMessage = message.trim()
    if (formattedMessage === '') return

    const event: NostrEvent = createEvent(
      pubkey,
      formattedMessage,
      // TODO: use chat channel ID corresponding to channelPubkey
      'cb1a5b962701e2c44a7bcf18fb3a60cbc8caec576c776749507acc952df97fcd',
    )
    // error handling here? What if none of the relays accepted our message...
    try {
      const signedEvent = await window.nostr.signEvent(event)
      console.debug('signedEvent', signedEvent)
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      console.debug('event id', signedEvent.id)
      nostrClient.publish(signedEvent)
    } catch (err: any) {
      console.error(err.message)
      toast.error(err.message, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }

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
    <div className="flex w-full flex-col bg-stone-800 sm:border-l sm:border-solid sm:border-gray-500">
      <div className="hidden justify-center border-b border-solid border-gray-500 sm:flex">
        <p className="py-2 px-4 font-normal text-white">CHAT</p>
      </div>
      <Virtuoso
        // logLevel={LogLevel.DEBUG}
        data={notes}
        followOutput
        // followOutput={'smooth'}
        ref={virtuosoRef}
        className={'max-h-[calc(100vh-12.5rem)]'}
        // not sure on these pixel calcs, but 1000px bottom seems to have *improved*
        // the scrollToBottom issue as recommended by virtuoso guy.
        increaseViewportBy={{
          top: 200,
          bottom: 2000,
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

      <div ref={setChatRef} className="flex w-full flex-row gap-1 py-3 px-3 sm:flex-col">
        <MessageInput message={message} setMessage={setMessage} handleSubmitMessage={handleSubmitMessage} />
        <div className="flex justify-end">
          <button
            className="inline-flex items-center rounded bg-primary px-3 py-2 text-sm font-semibold uppercase shadow-md transition duration-150 ease-in-out hover:bg-primary/80 hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-500"
            // disabled={showTip}
            disabled={!canSign}
            onClick={(e) => handleSubmitMessage(e)}
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  )
}
