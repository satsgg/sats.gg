import { useRef, useState, useEffect } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
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
import MessageInput from './MessageInput'
import { useSubscription } from '~/hooks/useSubscription'
import useCanSign from '~/hooks/useCanSign'
import { toast } from 'react-toastify'
import { UserMetadataStore, nostrClient } from '~/nostr/NostrClient'
import useAuthStore from '~/hooks/useAuthStore'
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
import ScrollToButtomButton from './ScollToBottomButton'
import { Spinner } from '../Spinner'
import EmojiPicker from 'emoji-picker-react'

const eventOrder = {
  created_at: null,
  content: null,
}

type ZapState = {
  invoice: string | null
  loading: boolean
  showZapChat: boolean
  permaZap: boolean
}

const defaultZapState: ZapState = {
  invoice: null,
  loading: false,
  showZapChat: false,
  permaZap: false,
}

export const Chat = ({
  channelPubkey,
  providerPubkey,
  streamId,
  channelIdentifier,
  channelProfile,
}: {
  channelPubkey: string
  providerPubkey: string | undefined
  streamId: string
  channelIdentifier: string
  channelProfile: UserMetadataStore | undefined
}) => {
  const [user, pubkey, view, privkey] = useAuthStore((state) => [state.user, state.pubkey, state.view, state.privkey])
  const canSign = useCanSign()
  const [chatLoading, setChatLoading] = useState(true)

  const virtuosoRef = useRef<VirtuosoHandle>(null)

  const [showBottomButton, setShowBottomButton] = useState(false)
  const [atBottom, setAtBottom] = useState(false)
  const showButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [onLoadScrollToBottom, setOnLoadScrollToBottom] = useState(false)

  const relays = useSettingsStore((state) => state.relays)

  const [zapState, setZapState] = useState<ZapState>(defaultZapState)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const { available: weblnAvailable, weblnPay } = useWebln()

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

  const notes = useSubscription(providerPubkey || channelPubkey, filters, false, 250)

  useFetchZap('chat-zap', channelProfile?.pubkey, zapState.invoice, () => {
    setTimeout(() => {
      setFocus('message')
    }, 1)

    setValue('message', '')
    if (zapState.permaZap) {
      setZapState((prev) => {
        return {
          ...prev,
          invoice: null,
          loading: false,
        }
      })
      return
    }
    setZapState(defaultZapState)
    setValue('amount', user?.defaultZapAmount || 1000)
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
      amount: z.number().min(1),
    }),
    // defaultValues: {
    //   message: '',
    //   amount: user?.defaultZapAmount || 1000,
    // },
  })
  const message = watch('message')

  useEffect(() => {
    reset({
      message: '',
      amount: user?.defaultZapAmount || 1000,
    })
  }, [user])

  // True when < 640px (tailwind sm)
  const resetZapInfo = !useMediaQuery('(min-width: 640px)')
  useEffect(() => {
    if (resetZapInfo) setZapState(defaultZapState)
  }, [resetZapInfo])

  // Hacky patch to get the chat to scroll to bottom after mounting...
  useEffect(() => {
    if (!onLoadScrollToBottom) return
    virtuosoRef.current?.scrollToIndex({ index: notes.length - 1, behavior: 'auto' })
    setOnLoadScrollToBottom(false)
    console.log('notes', notes)
    setChatLoading(false)
  }, [notes])

  // TODO: Replace virtuoso
  // use an actual initial query for notes... time based only works for fast internet
  // faster relay connections?
  // loading needs an actual connection to relays, subscriptions and notes
  useEffect(() => {
    setTimeout(() => {
      setOnLoadScrollToBottom(true)
    }, 1500)
    setTimeout(() => {
      setChatLoading(false)
    }, 2000)
  }, [])

  // auto parse for zap slash command
  useEffect(() => {
    if (zapState.showZapChat) return

    const defaultZapRegex = /^(?:\/zap|\/z)(?:\s+)([a-zA-Z])/
    const parsedDefaultAmount = defaultZapRegex.exec(message)

    if (parsedDefaultAmount && parsedDefaultAmount[1]) {
      setValue('message', parsedDefaultAmount[1])
      setValue('amount', user?.defaultZapAmount || 1000)
      setZapState((prev) => {
        return {
          ...prev,
          showZapChat: true,
        }
      })
      return
    }

    const amountRegex = /^(?:\/zap|\/z)(?:\s+)(\d+)\s/
    const parsedAmount = amountRegex.exec(message)

    if (parsedAmount && parsedAmount[1]) {
      setValue('message', '')
      setValue('amount', Number(parsedAmount[1]))
      setZapState((prev) => {
        return {
          ...prev,
          showZapChat: true,
        }
      })
      return
    }
  }, [message])

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

    if (weblnAvailable && (await weblnPay(invoice))) {
      console.debug('Invoice paid via WebLN!')

      // NOTE: for whatever reason have to add this delay
      setTimeout(() => {
        setFocus('message')
      }, 1)

      setValue('message', '')
      if (zapState.permaZap) {
        setZapState((prev) => {
          return {
            ...prev,
            invoice: null,
            loading: false,
          }
        })
        return
      }

      setZapState(defaultZapState)
      setValue('amount', user?.defaultZapAmount || 1000)
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

  const onSubmitMessage = async (data: { message: string; amount: number }) => {
    if (!pubkey) return
    setShowEmojiPicker(false)

    const formattedMessage = data.message.trim()
    if (!zapState.showZapChat && formattedMessage === '') return

    let regex = /^(?:\/zap|\/z)(?:\s)?(\d+)?/

    let parsedSlashCommand = zapState.showZapChat ? null : regex.exec(formattedMessage)

    // send a zap
    if (parsedSlashCommand || zapState.showZapChat) {
      setZapState((prev) => {
        return {
          ...prev,
          loading: true,
        }
      })

      let finalAmount = data.amount
      let finalMessage = data.message

      if (parsedSlashCommand) {
        finalMessage = ''
        finalAmount = parsedSlashCommand[1] ? Number(parsedSlashCommand[1]) : finalAmount
        setZapState((prev) => {
          return {
            ...prev,
            showZapChat: true,
          }
        })
        setValue('message', finalMessage)
        setValue('amount', finalAmount)
      }

      const zapRequestArgs: ZapRequestArgs = {
        profile: channelPubkey,
        event: streamId,
        amount: finalAmount * 1000,
        comment: finalMessage,
        relays: relays,
      }

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

      return
    }

    // send a regular chat message
    const event: EventTemplate = createChatEvent(formattedMessage, providerPubkey || channelPubkey, channelIdentifier)
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

  useEffect(() => {
    return () => {
      if (showButtonTimeoutRef.current) {
        clearTimeout(showButtonTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (chatLoading) return
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
      case 1311:
        return <ChatMessage channelPubkey={providerPubkey || channelPubkey} note={note} />
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
            channelPubkey={providerPubkey || channelPubkey}
            pubkey={zap.pubkey}
            amount={amount}
            content={zap.content}
          />
        )
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
      <div className="relative h-full pb-3">
        <Virtuoso
          // logLevel={LogLevel.DEBUG}
          data={notes}
          followOutput
          // followOutput={'smooth'}
          ref={virtuosoRef}
          className={`max-h-[calc(100vh-12.0rem)] ${chatLoading ? 'hidden' : ''}`}
          // not sure on these pixel calcs, but 1000px bottom seems to have *improved*
          // the scrollToBottom issue as recommended by virtuoso guy.
          increaseViewportBy={{
            top: 200,
            bottom: 2000,
          }}
          atBottomStateChange={(bottom) => {
            setAtBottom(bottom)
          }}
          itemContent={(index, note) => {
            return renderNote(note)
          }}
        />
        {!!zapState.invoice && (
          <div className="absolute bottom-0 z-50 hidden max-h-[calc(100vh-12.5rem)] w-full overflow-x-hidden px-2 py-2 sm:block">
            <ZapInvoiceModule
              invoice={zapState.invoice}
              type="chat"
              close={() => {
                setZapState((prev) => {
                  return {
                    ...prev,
                    invoice: null,
                  }
                })
              }}
            />
          </div>
        )}
        {showBottomButton && !chatLoading && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pb-3">
            <ScrollToButtomButton
              onClick={() => virtuosoRef.current?.scrollToIndex({ index: notes.length - 1, behavior: 'auto' })}
            />
          </div>
        )}
        {chatLoading && (
          <div className="absolute bottom-0 left-1/2 z-0 w-full -translate-x-1/2 px-3 pt-3">
            <div className="w-full rounded border-l border-r border-t border-gray-500 bg-stone-900/75 px-3 py-1">
              <div className="flex gap-2">
                <Spinner height={4} width={4} />
                <p className="text-sm font-semibold text-gray-300">Connecting to chat</p>
              </div>
            </div>
          </div>
        )}
        {showEmojiPicker && (
          <div className="z-1 absolute bottom-0 left-1/2 w-full -translate-x-1/2 px-3">
            <EmojiPicker
              width="100%"
              height={400}
              // @ts-ignore
              theme="dark"
              onEmojiClick={(emoji) => {
                setValue('message', getValues().message + emoji.emoji)
              }}
            />
          </div>
        )}
      </div>

      <div className="z-1 flex w-full flex-row gap-1 px-3 pb-3 sm:flex-col">
        <MessageInput
          handleSubmitMessage={handleSubmit(onSubmitMessage)}
          disabled={!canSign || zapState.loading || !!zapState.invoice}
          placeholder={(() => {
            if (zapState.showZapChat && !zapState.permaZap) {
              return 'Send a zap message'
            } else if (zapState.showZapChat && zapState.permaZap) {
              return 'Perma zap mode!'
            } else {
              return 'Send a message'
            }
          })()}
          showZapChat={zapState.showZapChat}
          handleEmojiClicked={() => setShowEmojiPicker(!showEmojiPicker)}
          register={register}
        />
        <div className="mt-1 flex justify-between sm:mt-0">
          <div className="hidden gap-x-2 sm:flex">
            <ZapChatButton
              channelProfile={channelProfile}
              showZapChat={zapState.showZapChat}
              setPermaZap={() => {
                if (message === '') setFocus('message')
                setZapState((prev) => {
                  return {
                    ...prev,
                    showZapChat: true,
                    permaZap: true,
                  }
                })
              }}
              handleClick={() => {
                if (!zapState.showZapChat && message === '') {
                  setFocus('message')
                }

                if (zapState.showZapChat) {
                  setZapState(defaultZapState)
                  setValue('message', '')
                  setValue('amount', user?.defaultZapAmount || 1000)
                  return
                }
                setZapState((prev) => {
                  return {
                    ...prev,
                    showZapChat: true,
                  }
                })
              }}
            />
            {zapState.showZapChat && (
              <div className="relative">
                <div className="absolute top-2/4 right-3 grid -translate-y-2/4 ">
                  <span className="text-gray-400">sats</span>
                </div>
                <input
                  type="number"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="1000"
                  disabled={zapState.loading || !!zapState.invoice}
                  min={1}
                  className={`focus:shadow-outline h-8 w-32 resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic focus:border-primary-500 focus:bg-slate-900 focus:outline-none`}
                  {...register('amount', {
                    valueAsNumber: true,
                  })}
                />
              </div>
            )}
          </div>
          {zapState.showZapChat ? (
            <Button
              onClick={handleSubmit(onSubmitMessage)}
              disabled={!canSign || !isValid}
              icon={
                <LightningBolt
                  className={`${!!zapState.invoice || zapState.loading ? 'animate-pulse' : ''}`}
                  height={20}
                  width={20}
                  strokeWidth={1.5}
                />
              }
            >
              <span>chat</span>
            </Button>
          ) : (
            <Button disabled={!canSign} onClick={handleSubmit(onSubmitMessage)}>
              <span>chat</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
