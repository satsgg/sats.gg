import { useRef, useState, useEffect } from 'react'
import { Virtuoso, LogLevel, VirtuosoHandle } from 'react-virtuoso'
import { inferProcedureOutput } from '@trpc/server'
import { Event as NostrEvent, Filter, UnsignedEvent, verifySignature, validateEvent } from 'nostr-tools'
import { createEvent, createZapEvent, getZapEndpoint, requestZapInvoice } from '~/utils/nostr'
import MessageInput from './MessageInput'
import { useSubscription } from '~/hooks/useSubscription'
import { usePopper } from 'react-popper'
import useCanSign from '~/hooks/useCanSign'
import { toast } from 'react-toastify'
import { UserMetadataStore, nostrClient } from '~/nostr/NostrClient'
import useAuthStore from '~/hooks/useAuthStore'
import { AppRouter } from '~/server/routers/_app'
import ZapChatButton from '~/components/ZapChatButton'
import LightningBolt from '~/svgs/lightning-bolt.svg'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import useSettingsStore from '~/hooks/useSettingsStore'
import useWebln from '~/hooks/useWebln'
import { useFetchZap } from '~/hooks/useFetchZap'
import ChatMessage from './ChatMessage'
import ZapChatMessage from './ZapChatMessage'
import ZapInvoiceModule from '../ZapInvoiceModule'
import useMediaQuery from '~/hooks/useMediaQuery'
import Button from '../Button'
import { MAX_MSG_LEN } from '~/utils/util'

const eventOrder = {
  created_at: null,
  content: null,
}

type GetUserOutput = inferProcedureOutput<AppRouter['user']['getUser']>

export const Chat = ({
  channelPubkey,
  channelProfile,
  channelUser,
}: {
  channelPubkey: string
  channelProfile: UserMetadataStore | undefined
  channelUser: GetUserOutput | undefined
}) => {
  const { user } = useAuthStore()
  const pubkey = useAuthStore((state) => state.pubkey)
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
  const [onLoadScrollToBottom, setOnLoadScrollToBottom] = useState(false)

  const relays = useSettingsStore((state) => state.relays)
  const [zapInvoice, setZapInvoice] = useState<string | null>(null)
  const [showZapModule, setShowZapModule] = useState(false)
  const [showZapChat, setShowZapChat] = useState(false)
  // TODO: zapLoading unused? Need to clean up and double check closeZap()
  const [zapLoading, setZapLoading] = useState(false)
  const { available: weblnAvailable, weblnPay } = useWebln()

  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered

  const filters: Filter[] = [
    {
      // TODO: separate filter for zaps with pubkey equal to channelUser pubkey
      kinds: [42, 9735],
      // since and limit don't really work well
      since: now.current - 1000 * 60 * 60 * 24, // one day ago
      limit: 25,
      '#e': [channelUser?.chatChannelId || ''],
    },
  ]
  const notes = useSubscription(channelPubkey, filters, true, 250)
  const zap = useFetchZap(channelProfile?.pubkey, zapInvoice, () => setShowZapModule(false)) // closeZap?

  // need to either do this in the useEffect or pass to useFetchZap callback...
  const closeZap = () => {
    setZapInvoice(null)
    setZapLoading(false)
    setShowZapModule(false)
    setShowZapChat(false)
  }

  useEffect(() => {
    if (zap) {
      closeZap()
      console.debug('Zap successful, toasting!')
      toast.success('Zap successful!', {
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
  }, [zap])

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    setFocus,
    formState: { errors, isValid },
  } = useZodForm({
    mode: 'onChange',
    schema: z.object({
      message: z.string().max(MAX_MSG_LEN),
      amount: z.number().min(1).optional(),
    }),
    // defaultValues: {
    //   message: '',
    //   amount: user?.defaultZapAmount || 1000,
    // },
  })

  useEffect(() => {
    reset({
      message: '',
      amount: user?.defaultZapAmount || 1000,
    })
  }, [])

  // True when < 640px (tailwind sm)
  const resetZapInfo = !useMediaQuery('(min-width: 640px)')
  useEffect(() => {
    console.debug('resetZapInfo', resetZapInfo)
    if (resetZapInfo) {
      setZapInvoice(null)
      setZapLoading(false)
      setShowZapChat(false)
      setShowZapModule(false)
    }
  }, [resetZapInfo])

  // Hacky patch to get the chat to scroll to bottom after mounting...
  useEffect(() => {
    if (!onLoadScrollToBottom) return
    virtuosoRef.current?.scrollToIndex({ index: notes.length - 1, behavior: 'auto' })
    setOnLoadScrollToBottom(false)
  }, [notes])

  useEffect(() => {
    setTimeout(() => {
      setOnLoadScrollToBottom(true)
    }, 2000)
  }, [])

  const onSubmitMessage = async (data: any) => {
    console.debug('data', data)
    if (!pubkey || !channelUser?.chatChannelId) return

    const formattedMessage = data.message.trim()
    if (!showZapChat && formattedMessage === '') return

    if (showZapChat) {
      if (!channelProfile || zapLoading) return
      setZapLoading(true)
      const zapInfo = await getZapEndpoint(channelProfile)
      if (!zapInfo) {
        // toast error
        console.debug('zap info error!')
        setZapLoading(false)
        return
      }

      const amountMilliSats = data.amount * 1000

      const zapRequestArgs = {
        profile: channelProfile.pubkey,
        event: channelUser.chatChannelId,
        amount: amountMilliSats,
        comment: data.message,
        relays: relays,
      }

      const signedZapRequestEvent = await createZapEvent(zapRequestArgs)
      if (!signedZapRequestEvent) {
        setZapLoading(false)
        return
      }

      const invoice = await requestZapInvoice(signedZapRequestEvent, amountMilliSats, zapInfo.callback, zapInfo.lnurl)
      if (!invoice) {
        setZapLoading(false)
        return
      }

      setZapInvoice(invoice)
      if (weblnAvailable && (await weblnPay(invoice))) {
        console.debug('Invoice paid via WebLN!')
        setZapLoading(false)
        return
      }

      setShowZapModule(true)
    } else {
      const event: UnsignedEvent = createEvent(pubkey, formattedMessage, channelUser.chatChannelId)
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

      reset()
      return
    }
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

  const renderNote = (note: NostrEvent) => {
    switch (note.kind) {
      case 42:
        return <ChatMessage note={note} />
      case 9735:
        return <ZapChatMessage note={note} />
      default:
        return null
    }
  }

  // const uniqEvents = events.length > 0 ? uniqBy(events, 'id') : []

  return (
    <div className="flex w-full flex-col sm:border-l sm:border-solid sm:border-gray-500 sm:bg-stone-800">
      <div className="hidden justify-center border-b border-solid border-gray-500 sm:flex">
        <p className="py-2 px-4 font-normal uppercase text-white">chat</p>
      </div>
      {channelUser?.chatChannelId ? (
        <div className="relative h-full">
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
              return renderNote(note)
            }}
          />
          {zapInvoice && showZapModule && (
            <div className="absolute bottom-0 z-50 hidden max-h-[calc(100vh-12.5rem)] w-full overflow-x-hidden px-2 pt-2 sm:block">
              <ZapInvoiceModule invoice={zapInvoice} type="chat" close={closeZap} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-center">
          User has not set a chat channel!
        </div>
      )}

      {channelUser?.chatChannelId && showBottomButton && (
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
        <MessageInput
          handleSubmitMessage={handleSubmit(onSubmitMessage)}
          disabled={!canSign || !channelUser?.chatChannelId}
          placeholder={`Send a ${showZapChat ? 'zap message' : 'message'}`}
          showZapChat={showZapChat}
          register={register}
        />
        <div className="mt-1 flex justify-between sm:mt-0">
          <div className="hidden gap-x-2 sm:flex">
            <ZapChatButton
              channelProfile={channelProfile}
              chatChannelId={channelUser?.chatChannelId}
              showZapChat={showZapChat}
              setShowZapChat={setShowZapChat}
              setFocus={setFocus}
              getValues={getValues}
              setZapInvoice={setZapInvoice}
              setShowZapModule={setShowZapModule}
            />
            {showZapChat && (
              <div className="relative">
                <div className="absolute top-2/4 right-3 grid -translate-y-2/4 ">
                  <span className="text-gray-400">sats</span>
                </div>
                <input
                  type="number"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="1000"
                  min={1}
                  className={`focus:shadow-outline h-8 w-32 resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic focus:border-primary focus:bg-slate-900 focus:outline-none`}
                  {...register('amount', {
                    valueAsNumber: true,
                  })}
                />
              </div>
            )}
          </div>
          {showZapChat ? (
            <Button
              onClick={handleSubmit(onSubmitMessage)}
              disabled={!canSign || !channelUser?.chatChannelId || !isValid}
              icon={
                <LightningBolt
                  className={`${zapInvoice || zapLoading ? 'animate-pulse' : 'animate-flash'}`}
                  height={20}
                  width={20}
                  strokeWidth={1.5}
                />
              }
            >
              <span>chat</span>
            </Button>
          ) : (
            <Button disabled={!canSign || !channelUser?.chatChannelId} onClick={handleSubmit(onSubmitMessage)}>
              <span>chat</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
