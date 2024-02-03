import LightningBolt from '~/svgs/lightning-bolt.svg'
import LightningBoltDisabled from '~/svgs/lightning-bolt-disabled.svg'
import { UserMetadataStore } from '~/store/db'
import { createZapEvent, getZapEndpoint } from '~/utils/nostr'

// zap related libs
import { nip57, validateEvent, verifySignature } from 'nostr-tools'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useState, useEffect } from 'react'
import { useFetchZap } from '~/hooks/useFetchZap'
import { toast } from 'react-toastify'
import useWebln from '~/hooks/useWebln'
import useAuthStore from '~/hooks/useAuthStore'
import useCanSign from '~/hooks/useCanSign'
import { fmtNumber } from '~/utils/util'

const ZapButton = ({
  channelPubkey,
  providerPubkey,
  channelProfile,
  channelProfileIsLoading,
  streamIdentifier,
  zapInvoice,
  setZapInvoice,
  setShowZapModule,
}: {
  channelPubkey: string
  providerPubkey: string | undefined
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  streamIdentifier: string | undefined
  zapInvoice: string | null
  setZapInvoice: (invoice: string | null) => void
  setShowZapModule: (show: boolean) => void
}) => {
  const [user, view, privkey] = useAuthStore((state) => [state.user, state.view, state.privkey])
  const canSign = useCanSign()
  const relays = useSettingsStore((state) => state.relays)
  const [zapLoading, setZapLoading] = useState(false)
  const { available: weblnAvailable, weblnPay } = useWebln()

  useFetchZap('quick-zap', channelPubkey, zapInvoice, () => {
    setShowZapModule(false)
    setZapInvoice(null)
  })

  const disabled = () => {
    // TODO: could add option to just send sats via standard lnurl w/out zap
    return (
      channelProfileIsLoading ||
      !streamIdentifier ||
      !channelProfile ||
      (!channelProfile.lud06 && !channelProfile.lud16) ||
      !canSign
    )
  }

  const waiting = () => {
    return zapLoading || zapInvoice
  }

  const buttonState = () => {
    if (disabled()) return 'disabled'
    else if (waiting()) return 'waiting'
    else return 'ready'
  }

  const handleZapClick = async () => {
    if (!channelProfile || zapLoading || !streamIdentifier) return

    if (!zapLoading && zapInvoice) {
      setZapInvoice(null)
      setShowZapModule(false)
      return
    }

    setZapLoading(true)
    try {
      // TODO: Store zap endpoint callback url, min sendable, max sendable in user profile metadata (see spec)
      // and use for later verification
      const zapInfo = await getZapEndpoint(channelProfile)
      if (!zapInfo) throw new Error('Failed to fetch zap info')
      // setZapNostrPubkey(zapInfo.nostrPubkey)
      // this pubkey will be the pubkey of the 9735 receipt later
      const amountMilliSats = (user?.defaultZapAmount || 1000) * 1000
      const zapRequestArgs = {
        profile: channelPubkey,
        event: null, // event and comment will be added in chat zap
        // if we don't include the event, won't be able to tell if zap was via their chatroom/livestream...
        // TODO: overrideable here? idea is quick zaps...
        // maybe long press configure amount later
        amount: amountMilliSats,
        comment: '',
        relays: relays,
      }

      const defaultPrivKey = view === 'default' ? privkey : null
      const signedZapRequestEvent = await createZapEvent(
        zapRequestArgs,
        providerPubkey || channelPubkey,
        streamIdentifier,
        defaultPrivKey,
      )
      if (!signedZapRequestEvent) throw new Error('Failed to sign zap')

      let ok = validateEvent(signedZapRequestEvent)
      if (!ok) throw new Error('Invalid event')

      console.debug('signedZapRequestEvent', signedZapRequestEvent)
      let veryOk = verifySignature(signedZapRequestEvent)
      if (!veryOk) throw new Error('Invalid signature')

      const encodedZapRequest = encodeURI(JSON.stringify(signedZapRequestEvent))
      const zapRequestHttp = `${zapInfo.callback}?amount=${amountMilliSats}&nostr=${encodedZapRequest}&lnurl=${zapInfo.lnurl}`
      console.debug('zapRequestHttp', zapRequestHttp)

      // separate function for fetching invoice? store invoice?
      const resObj = await fetch(
        `${zapInfo.callback}?amount=${zapRequestArgs.amount}&nostr=${encodedZapRequest}&lnurl=${zapInfo.lnurl}`,
      ).then((res) => res.json())

      console.debug('resObj', resObj)
      if (resObj.status === 'ERROR') throw new Error(resObj.reason)

      const { pr: invoice } = resObj

      console.log('Success! Invoice: ', invoice)

      // Before setting zap invoice... should try to pay it with webLN?
      setZapInvoice(invoice)
      if (weblnAvailable && (await weblnPay(invoice))) {
        console.debug('Invoice paid via WebLN!')
        setZapLoading(false)
        return
      }
      // TODO: Should verify invoice before showing anything...
      // and display error toast if bad invoice
      setShowZapModule(true)
    } catch (err: any) {
      setZapLoading(false)
      console.error('Failed to create zap request', err)
      toast.error(err.message, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      return
    }

    setZapLoading(false)
  }

  return (
    <button
      className={`
        ${disabled() ? 'bg-stone-700' : 'bg-primary'}
        hidden h-8 items-center space-x-0.5 rounded px-3 py-1 sm:inline-flex`}
      disabled={disabled()}
      onClick={handleZapClick}
    >
      {
        {
          disabled: <LightningBoltDisabled height={18} width={18} strokeWidth={1.5} />,
          waiting: <LightningBolt className="animate-pulse" height={18} width={18} strokeWidth={1.5} />,
          ready: <LightningBolt height={18} width={18} strokeWidth={1.5} />,
        }[buttonState()]
      }
      <p className="text-sm font-semibold capitalize">{fmtNumber(user?.defaultZapAmount || 1000, true)}</p>
    </button>
  )
}

export default ZapButton
