import { useEffect, useRef, useState } from 'react'
import useAuthStore from '~/store/useAuthStore'
import { io, Socket } from 'socket.io-client'
import { Virtuoso } from 'react-virtuoso'
import { ChatMessageInput } from './ChatMessageInput'
import { ChatBadge } from './ChatBadge'
import NymImg from '../../assets/nym2.png'
import LNAuthImg from '../../assets/lnauth.png'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { TipModule } from './TipModule'

interface ServerMessage {
  type: string
  userName: string | undefined
  message: string
  badge: string | undefined
}

type UserSingleOutput = inferProcedureOutput<AppRouter['user']['getUser']>
interface ChannelUserProps {
  channelUser: UserSingleOutput
}

export const Chat = ({ channelUser }: ChannelUserProps) => {
  const { user, storeToken, storeNym } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<ServerMessage[]>([])
  const [showTip, setShowTip] = useState(false)

  const [tipAmount, setTipAmount] = useState<number>(0)

  useEffect(() => {
    const socket = io(`http://44.210.101.10/chat`, {
      auth: {
        token: storeToken,
      },
      query: {
        nym: storeNym,
        room: channelUser?.id,
      },
    })

    socketRef.current = socket
    socket.on('connect', () => {
      console.log('connected')
    })

    socket.on('serverMessage', (message: ServerMessage) => {
      setMessages((prevMessages) => {
        // TODO: Max message count
        // const newMessages = [message, ...prevMessages.slice(0,100)]
        return [...prevMessages, message]
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [storeToken])

  const handleSubmitMessage = (e: any) => {
    e.preventDefault()
    const formattedMessage = message.trim()
    if (formattedMessage === '') return

    if (/\d+sats/.test(formattedMessage)) {
      if (user) {
        const totalAmount = extractTipAmount(formattedMessage)
        if (totalAmount > 0) {
          setTipAmount(totalAmount)
          setShowTip(true)
          return
        }
      } else {
        // TODO: handle err must be logged in to tip?
        // or allow anon tip
        // Handle all potential invoice errors
        setMessage('')
        return
      }
    }

    socketRef.current?.emit('clientMessage', formattedMessage)
    setMessage('')
  }

  const extractTipAmount = (message: string) => {
    const regex = /\d+(?=sats)/g
    let amount = 0
    let match
    while ((match = regex.exec(message)) !== null) {
      amount += parseInt(match[0] ?? '0')
    }
    return amount
  }

  const finishTip = (payed: boolean) => {
    if (payed) {
      const formattedMessage = message.trim()
      socketRef.current?.emit('clientMessage', formattedMessage)
      setMessage('')
    }
    setShowTip(false)
  }

  const getSrcImg = (badge: string | undefined) => {
    switch (badge) {
      case 'nym':
        return NymImg
      case 'lnauth':
        return LNAuthImg
      case undefined:
        return undefined
    }
  }

  return (
    <div className="w-max-full flex grow flex-col border-l border-solid border-gray-500 bg-stone-800">
      <div className="flex justify-center border-b border-solid border-gray-500">
        <p className="py-2 px-4 font-normal text-white">CHAT</p>
      </div>
      <Virtuoso
        data={messages}
        followOutput={'auto'}
        itemContent={(index, msg) => {
          return (
            <div className="break-words px-3">
              {msg.type == 'userMessage' ? (
                <>
                  <ChatBadge src={getSrcImg(msg.badge)} />
                  <span className="text-sm text-white">{msg.userName}</span>
                  <span className="text-sm text-white">: </span>
                  <span className="text-sm text-white">{msg.message}</span>
                </>
              ) : (
                <span className="text-sm text-gray-300">{msg.message}</span>
              )}
            </div>
          )
        }}
      />
      <div className="flex w-full flex-col gap-3 py-3 px-3">
        {showTip && (
          <TipModule
            amount={tipAmount}
            toUserId={channelUser?.id}
            toUserName={channelUser?.userName}
            done={finishTip}
          />
        )}
        <div>
          <ChatMessageInput
            message={message}
            setMessage={setMessage}
            handleSubmitMessage={handleSubmitMessage}
            disabled={showTip}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="inline-flex items-center rounded bg-primary px-3 py-2 text-sm font-semibold uppercase shadow-md transition duration-150 ease-in-out hover:bg-primary/80 hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg"
            disabled={showTip}
            onClick={(e) => handleSubmitMessage(e)}
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  )
}
