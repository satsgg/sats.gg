import { useState } from 'react'
import CheckmarkSVG from '~/svgs/checkmark.svg'
import ClipboardSVG from '~/svgs/clipboard.svg'

const CopyValueBar = ({ value }: { value: string | undefined }) => {
  const [showCopied, setShowCopied] = useState(false)
  const handleClick = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setShowCopied(true)
    setTimeout(() => {
      setShowCopied(false)
    }, 2000)
  }

  return (
    <div className="flex w-full min-w-0 max-w-full text-white">
      <input
        type="button"
        className="grow overflow-x-auto rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary-500 focus:bg-slate-900"
        onClick={handleClick}
        value={value}
      />
      <button
        className="relative rounded-r border-2 border-gray-500 bg-primary-500 p-2 hover:bg-primary-600 active:bg-primary-700"
        onClick={handleClick}
        data-tooltip={showCopied ? 'Copied!' : 'Copy'}
        data-position="top"
        data-arrow
      >
        {showCopied ? (
          <CheckmarkSVG width={24} height={24} strokeWidth={2.5} stroke="white" />
        ) : (
          <ClipboardSVG width={24} height={24} strokeWidth={2.0} stroke="white" />
        )}
      </button>
    </div>
  )
}

export default CopyValueBar
