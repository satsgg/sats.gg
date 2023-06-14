import React, { useEffect, useRef } from 'react'

interface MessageInputProps {
  handleSubmitMessage: (e: any) => void
  disabled: boolean
  placeholder: string
  showZapChat: boolean
  register: Function
}

const MessageInput = ({ handleSubmitMessage, disabled, placeholder, showZapChat, register }: MessageInputProps) => {
  // TODO: Autogrow textarea...
  // const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  // useEffect(() => {
  //   const textArea = textAreaRef.current
  //   textArea?.addEventListener('keydown', () => {
  //     console.log(textArea.scrollHeight)
  //   })

  // }, [textAreaRef])

  return (
    <form className="w-full" spellCheck={false} onSubmit={handleSubmitMessage}>
      <textarea
        className={`${
          showZapChat ? 'bg-stone-700 ' : 'bg-stone-700'
        } focus:shadow-outline w-full resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow focus:border-primary focus:bg-slate-900 focus:outline-none`}
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
    </form>
  )
}

export default MessageInput
