import React, { MouseEventHandler, useEffect, useRef } from 'react'
import FaceSmile from '~/svgs/face-smile.svg'

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
      <div className="absolute -bottom-1.5 right-2 flex -translate-y-2/4 p-1 hover:rounded hover:bg-stone-500">
        <button type="button" onClick={handleEmojiClicked}>
          <FaceSmile height={22} width={22} strokeWidth={2.0} className="stroke-gray-300" />
        </button>
      </div>
    </form>
  )
}

export default MessageInput
