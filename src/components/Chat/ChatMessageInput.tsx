import React, { useEffect, useRef } from 'react'

interface ChatMessageInputProps {
  message: string
  setMessage: (e: any) => void
  handleSubmitMessage: (e: any) => void
  disabled: boolean
}

// TODO: use react-hook-form

export const ChatMessageInput = ({ message, setMessage, handleSubmitMessage, disabled }: ChatMessageInputProps) => {
  // TODO: Autogrow textarea...
  // const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  // useEffect(() => {
  //   const textArea = textAreaRef.current
  //   textArea?.addEventListener('keydown', () => {
  //     console.log(textArea.scrollHeight)
  //   })

  // }, [textAreaRef])

  return (
    <form
      className=""
      spellCheck={false}
      onSubmit={handleSubmitMessage}
      // onKeyDown={(e) => {
      //   // console.log("e.code", e.code, "e.shiftKey", e.shiftKey)
      //   if (e.code === 'Enter' && !e.shiftKey) {
      //     console.log('yes submit')
      //     handleSubmitMessage(e)
      //   } else {
      //     console.log('standard')
      //     e.preventDefault()
      //   }
      // }}
    >
      <textarea
        className="focus:shadow-outline w-full resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow focus:border-primary focus:bg-slate-900 focus:outline-none"
        id="chatMessage"
        placeholder="Send a message"
        autoComplete="off"
        value={message}
        rows={1}
        // ref={textAreaRef}
        disabled={disabled}
        onChange={(e) => {
          setMessage(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.code === 'Enter' && !e.shiftKey) {
            handleSubmitMessage(e)
          }
        }}
      />
    </form>
  )
}
