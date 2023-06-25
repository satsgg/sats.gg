import { useState } from 'react'
import Pause from '~/svgs/pause.svg'
import ArrowDown from '~/svgs/sm-down-arrow.svg'

// TODO: Better width handling...
const ScrollToButtomButton = ({ onClick }: { onClick: () => void }) => {
  const [hover, setHover] = useState(false)

  return (
    <button
      className="inline-flex w-full items-center rounded border border-gray-500 bg-stone-900/75 px-2 py-1 hover:bg-stone-700/80"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick()}
    >
      {hover ? <ArrowDown className="h-5 w-5" strokeWidth={3} /> : <Pause className="h-5 w-5" strokeWidth={3} />}
      <span className="w-40 whitespace-nowrap text-xs font-semibold">
        {hover ? 'Scroll to bottom!' : 'Chat paused due to scroll'}
      </span>
    </button>
  )
}

export default ScrollToButtomButton
