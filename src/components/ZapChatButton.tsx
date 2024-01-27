import LightningBolt from '~/svgs/lightning-bolt.svg'
import LightningBoltDisabled from '~/svgs/lightning-bolt-disabled.svg'
import Exit from '~/svgs/x.svg'
import { UserMetadataStore } from '~/store/db'
import { Dispatch, SetStateAction } from 'react'
import useCanSign from '~/hooks/useCanSign'

const ZapChatButton = ({
  channelProfile,
  showZapChat,
  setShowZapChat,
  setFocus,
  getValues,
  close,
}: {
  channelProfile: UserMetadataStore | undefined
  showZapChat: boolean
  setShowZapChat: Dispatch<SetStateAction<boolean>>
  setFocus: Function
  getValues: Function
  close: () => void
}) => {
  const canSign = useCanSign()
  const disabled = () => {
    return !channelProfile || (!channelProfile.lud06 && !channelProfile.lud16) || !canSign
  }

  const buttonState = () => {
    if (disabled()) return 'disabled'
    else if (showZapChat) return 'waiting'
    else return 'ready'
  }

  const handleOnClick = () => {
    if (!showZapChat && getValues('message') === '') {
      setFocus('message')
    }

    if (showZapChat) {
      close()
      return
    }
    setShowZapChat(true)
  }

  return (
    <button
      className={`${disabled() || showZapChat ? 'bg-stone-700' : 'bg-primary'}
      relative inline-flex h-8 items-center space-x-1 rounded px-3 py-1`}
      disabled={disabled()}
      onClick={handleOnClick}
      data-tooltip={buttonState() === 'ready' ? 'Zap Chat' : null}
      data-position="right"
      data-delay
      data-arrow
    >
      {
        {
          disabled: <LightningBoltDisabled height={20} width={20} strokeWidth={1.5} fill="white" />,
          waiting: <Exit height={20} width={20} strokeWidth={2.5} className="stroke-white" />,
          ready: <LightningBolt height={20} width={20} strokeWidth={1.5} fill="white" />,
        }[buttonState()]
      }
    </button>
  )
}

export default ZapChatButton
