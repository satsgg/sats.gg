import { useEffect, useRef, useState } from 'react'
import { Event as NostrEvent, Filter, verifySignature, validateEvent, EventTemplate } from 'nostr-tools'
import {
  ZapRequestArgs,
  createChatEvent,
  createZapEvent,
  getZapAmountFromReceipt,
  getZapEndpoint,
  parseZapRequest,
  requestZapInvoice,
  signEventPrivkey,
} from '~/utils/nostr'
import { nostrClient } from '~/nostr/NostrClient'
import { useSubscription } from '~/hooks/useSubscription'
import { UserMetadataStore } from '~/store/db'
import NewZapInvoiceModal from '~/components/NewZapInvoiceModal'
import { toast } from 'react-toastify'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Smile, Zap, Send, X, Copy, Check, ArrowDown, ChevronDown } from 'lucide-react'
import ChatMessage from './NewChatMessage'
import ChatUserModal from './NewChatUserModal'
import useCanSign from '~/hooks/useCanSign'
import useAuthStore from '~/hooks/useAuthStore'
import { MAX_MSG_LEN, DEFAULT_ZAP_AMOUNT } from '~/utils/util'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import useWebln from '~/hooks/useWebln'
import useSettingsStore from '~/hooks/useSettingsStore'
import ZapChatMessage from './NewZapChatMessage'
import { useFetchZap } from '~/hooks/useFetchZap'

const emojis = ['🤘', '💯', '😂', '😍', '🤔', '👍', '🎉', '🔥', '😎', '🙌']

type ModalPosition = {
  top: number
}

interface NewChatProps {
  channelPubkey: string
  providerPubkey: string | undefined
  streamId: string
  channelIdentifier: string
  channelProfile: UserMetadataStore | undefined
}

type ZapState = {
  invoice: string | null
  loading: boolean
  showZapChat: boolean
  // permaZap: boolean
}

const defaultZapState: ZapState = {
  invoice: null,
  loading: false,
  showZapChat: false,
  // permaZap: false,
}

export default function NewChat({
  channelPubkey,
  providerPubkey,
  streamId,
  channelIdentifier,
  channelProfile,
}: NewChatProps) {
  const [user, pubkey, view, privkey] = useAuthStore((state) => [state.user, state.pubkey, state.view, state.privkey])
  const canSign = useCanSign()
  const [zapState, setZapState] = useState<ZapState>(defaultZapState)
  const relays = useSettingsStore((state) => state.relays)
  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered

  const filters: Filter[] = [
    {
      kinds: [1311, 9735],
      // TODO: Smarter since..?
      since: now.current - 60 * 60 * 1, // 1 hour ago
      limit: 25,
      '#a': [`30311:${providerPubkey || channelPubkey}:${channelIdentifier}`],
    },
  ]

  const messages = useSubscription(providerPubkey || channelPubkey, filters, false, 250)

  const [selectedUserPubkey, setSelectedUserPubkey] = useState<string | null>(null)
  const [isZapMode, setIsZapMode] = useState(false)
  const { available: weblnAvailable, weblnPay } = useWebln()
  const [modalPosition, setModalPosition] = useState<ModalPosition>({ top: 0 })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isScrollLocked, setIsScrollLocked] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useFetchZap('chat-zap', channelProfile?.pubkey, zapState.invoice, () => {
    setTimeout(() => {
      setFocus('message')
    }, 1)

    setValue('message', '')
    // TODO: perma zap
    // if (zapState.permaZap) {
    //   setZapState((prev) => {
    //     return {
    //       ...prev,
    //       invoice: null,
    //       loading: false,
    //     }
    //   })
    //   return
    // }
    setIsZapMode(false)
    setZapState(defaultZapState)
    setValue('zapAmount', user?.defaultZapAmount || DEFAULT_ZAP_AMOUNT)
  })

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
      zapAmount: z.number().min(1),
    }),
  })
  const message = watch('message')

  useEffect(() => {
    reset({
      message: '',
      zapAmount: user?.defaultZapAmount || DEFAULT_ZAP_AMOUNT,
    })
  }, [user])

  const handleSendMessage = async ({ message, zapAmount }: { message: string; zapAmount: number }) => {
    if (isZapMode) {
      const zapRequestArgs: ZapRequestArgs = {
        profile: channelPubkey,
        event: streamId,
        amount: zapAmount * 1000,
        comment: message,
        relays: relays,
      }
      setZapState((prev) => {
        return {
          ...prev,
          loading: true,
        }
      })
      try {
        await sendZapChat(zapRequestArgs)
      } catch (err: any) {
        // failure to sign, failure to get zap invoice, failure to webln pay
        console.error(err)
        // TODO: test errors... just leave existing state?
        // setZapState(defaultZapState)
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
    } else {
      if (message.trim() === '') return
      // send a regular chat message
      const event: EventTemplate = createChatEvent(message, providerPubkey || channelPubkey, channelIdentifier)
      // error handling here? What if none of the relays accepted our message...
      try {
        const signedEvent: NostrEvent | null =
          view === 'default' ? signEventPrivkey(event, privkey) : await window.nostr.signEvent(event)
        if (!signedEvent) throw new Error('Failed to sign message')
        let ok = validateEvent(signedEvent)
        if (!ok) throw new Error('Invalid event')
        let veryOk = verifySignature(signedEvent)
        if (!veryOk) throw new Error('Invalid signature')
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
      setValue('message', '')
    }
  }

  const sendZapChat = async (zapRequestArgs: ZapRequestArgs) => {
    // TODO: getZap endpoint when the page is loaded... not per zap
    if (!channelProfile) return
    const zapInfo = await getZapEndpoint(channelProfile)
    if (!zapInfo) throw new Error('Failed to fetch zap endpoint')

    const defaultPrivKey = view === 'default' ? privkey : null
    const signedZapRequestEvent = await createZapEvent(
      zapRequestArgs,
      providerPubkey || channelPubkey,
      channelIdentifier,
      defaultPrivKey,
    )
    if (!signedZapRequestEvent) throw new Error('Failed to sign zap')

    const invoice = await requestZapInvoice(
      signedZapRequestEvent,
      zapRequestArgs.amount,
      zapInfo.callback,
      zapInfo.lnurl,
    )
    if (!invoice) throw new Error('Failed to fetch zap invoice')

    if (weblnAvailable && (await weblnPay(invoice)).success) {
      console.debug('Invoice paid via WebLN!')

      setTimeout(() => {
        setFocus('message')
      }, 1)

      setValue('message', '')
      setZapState(defaultZapState)
      setValue('zapAmount', user?.defaultZapAmount || DEFAULT_ZAP_AMOUNT)
      return
    }

    setZapState((prev) => {
      return {
        ...prev,
        invoice: invoice,
        loading: false,
      }
    })
  }

  useEffect(() => {
    closeUserModal()
  }, [channelPubkey, channelIdentifier, providerPubkey])

  const handleEmojiClick = (emoji: string) => {
    setValue('message', getValues('message') + emoji)
  }

  const toggleZapMode = () => {
    if (!isZapMode) {
      setIsZapMode(true)
      return
    }
    setZapState(defaultZapState)
    setIsZapMode(false)
  }

  const closeUserModal = () => {
    setSelectedUserPubkey(null)
  }

  const openUserModal = (pubkey: string, event: React.MouseEvent) => {
    if (selectedUserPubkey === pubkey) {
      closeUserModal()
      return
    }

    const rect = scrollAreaRef.current?.getBoundingClientRect()
    const scrollTop = scrollAreaRef.current?.scrollTop || 0
    if (rect) {
      const clickY = event.clientY - rect.top + scrollTop
      const modalHeight = 150 // Approximate height of the modal
      const spaceBelow = rect.height - clickY

      let top
      if (spaceBelow >= modalHeight) {
        // If there's enough space below, position the modal below the click
        top = clickY + 10 // 10px gap
      } else {
        // If there's not enough space below, position the modal above the click
        top = clickY - modalHeight - 10 // 10px gap
      }

      // Ensure the modal stays within the bounds of the scroll area
      top = Math.max(0, Math.min(top, rect.height - modalHeight))

      setModalPosition({ top })
    }
    setSelectedUserPubkey(pubkey)
  }

  const closeZapModal = () => {
    setZapState(defaultZapState)
  }

  const renderNote = (note: NostrEvent) => {
    switch (note.kind) {
      case 1311:
        return (
          <ChatMessage
            key={note.id}
            pubkey={note.pubkey}
            channelPubkey={providerPubkey || channelPubkey}
            note={note}
            openUserModal={openUserModal}
          />
        )
      case 9735:
        const zapRequestTag = note.tags.find((t) => t[0] == 'description')
        if (!zapRequestTag || !zapRequestTag[1]) return

        const zapRequest: NostrEvent<9734> = JSON.parse(zapRequestTag[1])
        const zap = parseZapRequest(zapRequest)
        if (!zap) return

        const amount = getZapAmountFromReceipt(note as NostrEvent<9735>)
        if (!amount) return

        return (
          <ZapChatMessage
            key={note.id}
            channelPubkey={providerPubkey || channelPubkey}
            pubkey={zap.pubkey}
            amount={amount}
            content={zap.content}
            openUserModal={openUserModal}
          />
        )
      default:
        return null
    }
  }

  const handleScroll = (event: Event) => {
    const scrollContainer = event.target as HTMLDivElement
    const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 10 // 10px threshold

    setIsScrollLocked(isAtBottom)
    setShowScrollButton(!isAtBottom)
    console.debug('showScrollButton', !isAtBottom)
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewportRef.current = viewport as HTMLDivElement
        viewport.addEventListener('scroll', handleScroll)
      }
    }

    // Cleanup
    return () => {
      if (viewportRef.current) {
        viewportRef.current.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
        setIsScrollLocked(true)
        setShowScrollButton(false)
      }
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current && isScrollLocked) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isScrollLocked]) // Auto-scroll when messages change IF we're in locked mode

  return (
    <div className="flex w-80 flex-col border-l bg-background">
      <div className="flex items-center justify-center border-b p-3">
        <h2 className="text-lg font-semibold">Stream Chat</h2>
      </div>
      <ScrollArea className="relative flex-grow" ref={scrollAreaRef}>
        {messages.map((message) => renderNote(message))}
        {selectedUserPubkey && (
          <ChatUserModal pubkey={selectedUserPubkey} modalPosition={modalPosition} closeUserModal={closeUserModal} />
        )}
        {!!zapState.invoice && <NewZapInvoiceModal invoice={zapState.invoice} closeZapModal={closeZapModal} />}
        {showScrollButton && (
          <Button
            className="absolute bottom-2 right-8 left-8 rounded-full shadow-md"
            size="sm"
            onClick={scrollToBottom}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            New messages
          </Button>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit(handleSendMessage)} className="space-y-2 border-t p-3">
        <div className="relative">
          <Input
            type="text"
            placeholder={isZapMode ? 'Send a zap message' : 'Send a message'}
            value={message}
            autoComplete="off"
            {...register('message')}
            className="pr-10"
            disabled={!canSign || zapState.loading || !!zapState.invoice}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="absolute right-0 top-0 h-full px-3" type="button">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="grid grid-cols-5 gap-2 p-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="rounded text-2xl hover:bg-muted"
                    onClick={() => handleEmojiClick(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex justify-between space-x-2">
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={toggleZapMode}>
              {isZapMode ? <X className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            </Button>
            {isZapMode && (
              <div className="relative w-24">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <span className="text-sm text-muted-foreground">sats</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="Amount"
                  autoComplete="off"
                  {...register('zapAmount', {
                    valueAsNumber: true,
                  })}
                  className="w-full pr-10"
                  style={{
                    textAlign: 'left',
                  }}
                  disabled={!canSign || zapState.loading || !!zapState.invoice}
                />
              </div>
            )}
          </div>
          <Button type="submit">
            {isZapMode ? <Zap className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
