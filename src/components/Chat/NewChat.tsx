import { Filter } from 'nostr-tools'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from '~/hooks/useSubscription'
import { UserMetadataStore } from '~/store/db'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Smile, Zap, Send, X, Copy, Check } from 'lucide-react'
import ChatMessage from './NewChatMessage'
import ChatUserModal from './NewChatUserModal'

const emojis = ['🤘', '💯', '😂', '😍', '🤔', '👍', '🎉', '🔥', '😎', '🙌']

type ModalPosition = {
  top: number
}

interface NewChatProps {
  channelPubkey: string
  providerPubkey: string | undefined
  streamId: string | undefined
  channelIdentifier: string | undefined
  channelProfile: UserMetadataStore | undefined
}
export default function NewChat({
  channelPubkey,
  providerPubkey,
  streamId,
  channelIdentifier,
  channelProfile,
}: NewChatProps) {
  // const [user, pubkey, view, privkey] = useAuthStore((state) => [state.user, state.pubkey, state.view, state.privkey])
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

  const [newMessage, setNewMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUserPubkey, setSelectedUserPubkey] = useState<string | null>(null)
  const [isZapMode, setIsZapMode] = useState(false)
  const [zapAmount, setZapAmount] = useState('')
  const [showZapModal, setShowZapModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [modalPosition, setModalPosition] = useState<ModalPosition>({ top: 0 })
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // const handleSendMessage = (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (newMessage.trim() !== '') {
  //     if (isZapMode && zapAmount) {
  //       setShowZapModal(true)
  //     } else {
  //       const newMsg: Message = {
  //         id: messages.length + 1,
  //         user: 'You',
  //         content: newMessage.trim(),
  //         avatar: '/placeholder.svg?height=32&width=32',
  //       }
  //       setMessages([...messages, newMsg])
  //       setNewMessage('')
  //     }
  //   }
  // }

  useEffect(() => {
    closeUserModal()
  }, [channelPubkey, channelIdentifier, providerPubkey])

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(newMessage + emoji)
  }

  const toggleZapMode = () => {
    if (isZapMode) {
      resetZapMode()
    } else {
      setIsZapMode(true)
      setZapAmount('100') // Default zap amount
    }
  }

  const resetZapMode = () => {
    setIsZapMode(false)
    setZapAmount('')
    setShowZapModal(false)
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

  const handleZapAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value)) {
      setZapAmount(value)
    }
  }

  const closeZapModal = () => {
    setShowZapModal(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText('lnbc1234567890...') // Replace with actual invoice
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex w-80 flex-col border-l bg-background">
      <div className="flex items-center justify-center border-b p-3">
        <h2 className="text-lg font-semibold">Stream Chat</h2>
      </div>
      <ScrollArea className="relative flex-grow px-3 py-1" ref={scrollAreaRef}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            pubkey={message.pubkey}
            channelPubkey={channelPubkey}
            note={message}
            openUserModal={openUserModal}
          />
        ))}
        {selectedUserPubkey && (
          <ChatUserModal pubkey={selectedUserPubkey} modalPosition={modalPosition} closeUserModal={closeUserModal} />
        )}
        {showZapModal && (
          <div className="absolute inset-x-0 bottom-0 flex max-h-[70%] flex-col overflow-hidden border-t border-border bg-background">
            <ScrollArea className="flex-grow">
              <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Zap Chat</h3>
                  <Button variant="ghost" size="icon" onClick={closeZapModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-4 flex aspect-square items-center justify-center bg-muted">
                  <span className="text-muted-foreground">QR Code Placeholder</span>
                </div>
                <div className="mb-2 flex">
                  <Input readOnly value="lnbc1234567890..." className="flex-grow" />
                  <Button variant="outline" className="ml-2" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Amount: {zapAmount} sats (${(Number(zapAmount) * 0.0003).toFixed(2)} USD)
                </p>
              </div>
            </ScrollArea>
          </div>
        )}
      </ScrollArea>
      {/* <form onSubmit={handleSendMessage} className="space-y-2 border-t p-3"> */}
      <form className="space-y-2 border-t p-3">
        <div className="relative">
          <Input
            type="text"
            placeholder={isZapMode ? 'Send a zap message' : 'Send a message'}
            value={newMessage}
            onChange={(e: any) => setNewMessage(e.target.value)}
            className="pr-10"
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
                  value={zapAmount}
                  onChange={handleZapAmountChange}
                  className="w-full pr-10"
                  style={{
                    direction: 'rtl',
                    textAlign: 'left',
                  }}
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
