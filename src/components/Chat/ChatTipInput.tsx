interface ChatTipInputProps {
  tipMessage: string
  tipAmount: number
  setTipMessage: (e: any) => void
  setTipAmount: (e: any) => void
  handleSubmitTip: (e: any) => void
}

export const ChatTipInput = ({
  tipMessage,
  tipAmount,
  setTipMessage,
  setTipAmount,
  handleSubmitTip,
}: ChatTipInputProps) => {
  return (
    <div className="flex flex-col gap-3">
      <form className="" spellCheck={false} onSubmit={handleSubmitTip}>
        <input
          className="focus:shadow-outline w-full appearance-none rounded border bg-inherit py-2 px-3 leading-tight text-white shadow focus:border-blue-600 focus:outline-none"
          type="number"
          placeholder="0"
          autoComplete="off"
          value={tipAmount}
          onChange={(e) => {
            setTipAmount(e.target.value)
          }}
        />
      </form>
      <form className="" spellCheck={false} onSubmit={handleSubmitTip}>
        <input
          className="focus:shadow-outline w-full appearance-none rounded border bg-inherit py-2 px-3 leading-tight text-white shadow focus:border-blue-600 focus:outline-none"
          type="text"
          placeholder="Write a tip message"
          autoComplete="off"
          value={tipMessage}
          onChange={(e) => {
            setTipMessage(e.target.value)
          }}
        />
      </form>
    </div>
  )
}
