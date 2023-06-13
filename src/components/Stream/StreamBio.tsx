import FollowButton from './FollowButton'
import LightningBolt from '~/svgs/lightning-bolt.svg'
import LightningBoltDisabled from '~/svgs/lightning-bolt-disabled.svg'
import ProfileImg from '../ProfileImg'
import { displayName } from '~/utils/nostr'
import { UserMetadataStore } from '~/store/db'
import { StreamStatus } from '@prisma/client'
import { getZapEndpoint } from '~/utils/nostr'

// zap related libs
import { nip57, validateEvent, verifySignature } from 'nostr-tools'
import useSettingsStore from '~/hooks/useSettingsStore'
import { useState, useEffect } from 'react'
import { useFetchZap } from '~/hooks/useFetchZap'
import { toast } from 'react-toastify'
import useWebln from '~/hooks/useWebLn'

const ZapButton = ({
  channelProfile,
  channelProfileIsLoading,
  zapInvoice,
  setZapInvoice,
  setShowZapModule,
}: {
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  zapInvoice: string | null
  setZapInvoice: (invoice: string | null) => void
  setShowZapModule: (show: boolean) => void
}) => {
  const relays = useSettingsStore((state) => state.relays)
  const [zapLoading, setZapLoading] = useState(false)
  const { available: weblnAvailable, weblnPay } = useWebln()

  const zap = useFetchZap(channelProfile?.pubkey, zapInvoice, () => setShowZapModule(false))

  useEffect(() => {
    if (zap) {
      setZapInvoice(null)
      console.debug('Zap successful, toasting!')
      toast.success('Zap successful!', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }, [zap])

  const disabled = () => {
    // TODO: have to be able to sign to zap...
    // could add option to just send sats via standard lnurl w/out zap
    return channelProfileIsLoading || !channelProfile || (!channelProfile.lud06 && !channelProfile.lud16)
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
    console.debug('channelProfile', channelProfile)
    if (!channelProfile) return
    if (!zapLoading && zapInvoice) {
      setZapInvoice(null)
      setShowZapModule(false)
      return
    }
    setZapLoading(true)
    // TODO: Store zap endpoint callback url, min sendable, max sendable in user profile metadata (see spec)
    const zapInfo = await getZapEndpoint(channelProfile)
    if (!zapInfo) {
      // toast error
      console.debug('NO ZAP ENDPOINT')
      setZapLoading(false)
      return
    }

    console.debug('zap endpoint', zapInfo)
    // setZapNostrPubkey(zapInfo.nostrPubkey)
    // TODO: Store zap endpoint nostrPubkey for later verification...
    // this pubkey will be the pubkey of the 9735 receipt later
    const zapRequestArgs = {
      profile: channelProfile.pubkey,
      event: null, // event and comment will be added in chat zap
      // if we don't include the event, won't be able to tell if zap was via their chatroom/livestream...
      // TODO: Default amount configurable in settings
      // overrideable here? idea is quick zaps...
      // maybe long press configure amount later
      amount: 1000,
      comment: 'test comment',
      relays: relays,
    }

    try {
      const zapRequestEvent = nip57.makeZapRequest(zapRequestArgs)
      const signedZapRequestEvent = await window.nostr.signEvent(zapRequestEvent)

      let ok = validateEvent(signedZapRequestEvent)
      if (!ok) throw new Error('Invalid event')

      console.debug('signedZapRequestEvent', signedZapRequestEvent)
      let veryOk = verifySignature(signedZapRequestEvent)
      if (!veryOk) throw new Error('Invalid signature')

      const encodedZapRequest = encodeURI(JSON.stringify(signedZapRequestEvent))
      const zapRequestHttp = `${zapInfo.callback}?amount=${zapRequestArgs.amount}&nostr=${encodedZapRequest}&lnurl=${zapInfo.lnurl}`
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
        console.log('Invoice paid via WebLN!')
        setZapLoading(false)
        return
      }
      // TODO: Should verify invoice before showing anything...
      // and display error toast if bad invoice
      console.debug('setting show zap module')
      setShowZapModule(true)
    } catch (e: any) {
      setZapLoading(false)
      console.error('Failed to create zap request', e)
      return
    }

    setZapLoading(false)
  }

  return (
    <button
      className={`${disabled() ? 'bg-stone-700' : 'bg-primary'}
      inline-flex h-8 items-center space-x-1 rounded px-3 py-1`}
      disabled={disabled()}
      onClick={handleZapClick}
    >
      {
        {
          disabled: <LightningBoltDisabled height={20} width={20} strokeWidth={1.5} />,
          waiting: <LightningBolt className="animate-zap" height={20} width={20} strokeWidth={1.5} />,
          ready: <LightningBolt height={20} width={20} strokeWidth={1.5} />,
        }[buttonState()]
      }
      <p className="text-sm font-semibold capitalize">zap</p>
    </button>
  )
}

export const StreamBio = ({
  channelPubkey,
  channelProfile,
  channelProfileIsLoading,
  streamTitle,
  streamStatus,
  zapInvoice,
  setZapInvoice,
  setShowZapModule,
}: {
  channelPubkey: string
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  streamTitle: string | null | undefined
  streamStatus: string | undefined
  zapInvoice: string | null
  setZapInvoice: (invoice: string | null) => void
  setShowZapModule: (show: boolean) => void
}) => {
  return (
    <div id="streamBioWrapper" className="flex grow flex-col gap-4 px-4 py-2 md:px-6 md:py-4">
      <div id="profile" className="flex gap-2">
        <div className="h-12 w-12 shrink-0 md:h-16 md:w-16">
          {channelProfileIsLoading ? (
            <div className="h-full w-full rounded-[50%] bg-gray-600" />
          ) : (
            <ProfileImg
              pubkey={channelPubkey}
              picture={channelProfile?.picture}
              liveBorder={streamStatus === StreamStatus.ACTIVE}
            />
          )}
        </div>

        <div className="flex w-full min-w-0 justify-between">
          <div className="flex min-w-0 flex-col">
            <span className="min-h-0 truncate text-lg font-bold text-white">
              {!channelProfileIsLoading && displayName(channelPubkey, channelProfile)}
            </span>
            {streamTitle && (
              <span className="min-h-0 truncate break-words text-lg text-white xl:whitespace-normal">
                {streamTitle}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <FollowButton pubkey={channelPubkey} />
            <ZapButton
              channelProfile={channelProfile}
              channelProfileIsLoading={channelProfileIsLoading}
              zapInvoice={zapInvoice}
              setZapInvoice={setZapInvoice}
              setShowZapModule={setShowZapModule}
            />
          </div>
        </div>
      </div>

      <div id="about" className="hidden rounded bg-stone-800 p-12 sm:block">
        <p className="font-semi text-xl text-white">About {channelProfile?.name}</p>
        <p className="font-semi text-lg text-white">{channelProfile?.about}</p>
      </div>

      <div className="hidden h-screen w-full border-4 border-cyan-500 sm:block" />
    </div>
  )
}
