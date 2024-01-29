import React, { MouseEventHandler, useEffect, useRef } from 'react'

interface MessageInputProps {
  handleSubmitMessage: (e: any) => void
  disabled: boolean
  placeholder: string
  showZapChat: boolean
  register: Function
  handleEmojiClicked: MouseEventHandler<HTMLButtonElement>
}

const MessageInput = ({
  handleSubmitMessage,
  disabled,
  placeholder,
  showZapChat,
  register,
  handleEmojiClicked,
}: MessageInputProps) => {
  // TODO: Autogrow textarea...
  // const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  // useEffect(() => {
  //   const textArea = textAreaRef.current
  //   textArea?.addEventListener('keydown', () => {
  //     console.log(textArea.scrollHeight)
  //   })

  // }, [textAreaRef])

  return (
    <form className="relative w-full" spellCheck={false} onSubmit={handleSubmitMessage}>
      <textarea
        className={`${
          showZapChat ? 'bg-stone-700 ' : 'bg-stone-700'
        } focus:shadow-outline w-full resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 pl-3 pr-12 leading-tight text-white shadow focus:border-primary focus:bg-slate-900 focus:outline-none`}
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
        {...register('message')}
      />
      <button type="button" className="absolute right-3 bottom-0 -translate-y-2/4" onClick={handleEmojiClicked}>
        😂
      </button>
    </form>
  )
}

export default MessageInput
