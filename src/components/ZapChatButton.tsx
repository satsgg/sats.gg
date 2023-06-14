import LightningBolt from '~/svgs/lightning-bolt.svg'
import LightningBoltDisabled from '~/svgs/lightning-bolt-disabled.svg'
import Exit from '~/svgs/x.svg'
import { UserMetadataStore } from '~/store/db'
import { Dispatch, SetStateAction } from 'react'

const ZapChatButton = ({
  channelProfile,
  chatChannelId,
  showZapChat,
  setShowZapChat,
  setFocus,
  getValues,
}: {
  channelProfile: UserMetadataStore | undefined
  chatChannelId: string | undefined | null
  showZapChat: boolean
  setShowZapChat: Dispatch<SetStateAction<boolean>>
  setFocus: Function
  getValues: Function
}) => {
  const disabled = () => {
    // TODO: have to be able to sign to zap...
    // could add option to just send sats via standard lnurl w/out zap
    return !chatChannelId || !channelProfile || (!channelProfile.lud06 && !channelProfile.lud16)
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
    setShowZapChat((show) => !show)
  }

  return (
    <button
      className={`${disabled() || showZapChat ? 'bg-stone-700' : 'bg-primary'}
      inline-flex h-8 items-center space-x-1 rounded px-3 py-1`}
      disabled={disabled()}
      onClick={handleOnClick}
    >
      {
        {
          disabled: <LightningBoltDisabled height={20} width={20} strokeWidth={1.5} />,
          waiting: <Exit height={20} width={20} strokeWidth={2.5} />,
          ready: <LightningBolt height={20} width={20} strokeWidth={1.5} />,
        }[buttonState()]
      }
    </button>
  )
}

export default ZapChatButton
