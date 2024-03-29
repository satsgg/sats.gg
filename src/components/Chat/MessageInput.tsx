import React, { MouseEventHandler, useEffect, useRef } from 'react'
import { UseFormRegister } from 'react-hook-form'
import FaceSmile from '~/svgs/face-smile.svg'

interface MessageInputProps {
  handleSubmitMessage: (e: any) => void
  disabled: boolean
  placeholder: string
  showZapChat: boolean
  // register: Function
  message: string
  register: UseFormRegister<{
    message: string
    amount: number
  }>
  handleEmojiClicked: MouseEventHandler<HTMLButtonElement>
}

const MessageInput = ({
  handleSubmitMessage,
  disabled,
  placeholder,
  showZapChat,
  message,
  register,
  handleEmojiClicked,
}: MessageInputProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const { ref, ...rest } = register('message')

  useEffect(() => {
    const textarea = textAreaRef.current
    if (!textarea) return
    textarea.style.height = 'auto' // Reset height to enable shrink
    // 20px currently, based off leading-tight (line height based off font size)
    const maxHeight = 20 * 6 // 6 rows of text
    // scroll height: 36 -> 56 (+20 per row)
    // want initial height to be offsetHeight (38)
    textarea.style.height = `${Math.min(textarea.scrollHeight + 2, maxHeight)}px`
  }, [message])

  return (
    <form className="relative flex w-full" spellCheck={false} onSubmit={handleSubmitMessage}>
      <textarea
        className={`${
          showZapChat ? 'bg-stone-700 ' : 'bg-stone-700'
        } focus:shadow-outline w-full resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 pl-3 pr-12 leading-tight text-white shadow focus:border-primary-500 focus:bg-slate-900 focus:outline-none`}
        id="chatMessage"
        placeholder={placeholder}
        autoComplete="off"
        rows={1}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.code === 'Enter' && !e.shiftKey) {
            handleSubmitMessage(e)
          }
        }}
        {...rest}
        // share react-hook-form ref
        ref={(e) => {
          ref(e)
          textAreaRef.current = e
        }}
      />
      <div className="absolute right-2 bottom-[.25rem] flex p-1 hover:rounded hover:bg-stone-500">
        <button type="button" onClick={handleEmojiClicked}>
          <FaceSmile height={22} width={22} strokeWidth={2.0} className="stroke-gray-300" />
        </button>
      </div>
    </form>
  )
}

export default MessageInput
