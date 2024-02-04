import LightningBolt from '~/svgs/lightning-bolt.svg'
import LightningBoltDisabled from '~/svgs/lightning-bolt-disabled.svg'
import Exit from '~/svgs/x.svg'
import { UserMetadataStore } from '~/store/db'
import { useState } from 'react'
import useCanSign from '~/hooks/useCanSign'
import Button from './Button'

const ZapChatButton = ({
  channelProfile,
  handleClick,
  setPermaZap,
  showZapChat,
}: {
  channelProfile: UserMetadataStore | undefined
  handleClick: () => void
  setPermaZap: Function
  showZapChat: boolean
}) => {
  const [timeoutId, setTimeoutId] = useState<number | null>(null)
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null)

  const canSign = useCanSign()
  const disabled = () => {
    return !channelProfile || (!channelProfile.lud06 && !channelProfile.lud16) || !canSign
  }

  const buttonState = () => {
    if (disabled()) return 'disabled'
    else if (showZapChat) return 'waiting'
    else return 'ready'
  }

  const handlePointerDown = () => {
    setMouseDownTime(Date.now())
    const id = window.setTimeout(() => {
      setPermaZap()
      setMouseDownTime(null)
    }, 500)
    setTimeoutId(id)
  }

  const handlePointerUp = () => {
    const mouseUpTime = Date.now()
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    // Check if it's a click (held for less than 500 ms)
    if (mouseDownTime && mouseUpTime - mouseDownTime < 500) {
      handleClick()
    }
  }

  const handlePointerLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }
  return (
    <Button
      disabled={disabled()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      data-tooltip={buttonState() === 'ready' ? 'Zap Chat' : null}
      data-position="right"
      data-delay
      data-arrow
    >
      {
        {
          disabled: <LightningBoltDisabled height={20} width={20} strokeWidth={1.5} fill="white" />,
          waiting: <Exit height={20} width={20} strokeWidth={4.0} className="stroke-white" />,
          ready: <LightningBolt height={20} width={20} strokeWidth={1.5} fill="white" />,
        }[buttonState()]
      }
    </Button>
  )
}

export default ZapChatButton
