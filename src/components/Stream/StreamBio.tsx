import { useProfile } from '~/hooks/useProfile'
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

const ZapButton = ({
  channelProfile,
  channelProfileIsLoading,
}: {
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
}) => {
  const relays = useSettingsStore((state) => state.relays)
  const disabled = () => {
    // TODO: have to be able to sign to zap...
    // could add option to just send sats via standard lnurl w/out zap
    return channelProfileIsLoading || !channelProfile || (!channelProfile.lud06 && !channelProfile.lud16)
  }
  const handleZapClick = async () => {
    console.debug('channelProfile', channelProfile)
    if (!channelProfile) return
    // TODO: Store zap endpoint callback url, min sendable, max sendable in user profile metadata (see spec)
    const zapInfo = await getZapEndpoint(channelProfile)
    if (!zapInfo) {
      // toast error
      console.debug('NO ZAP ENDPOINT')
      return
    }

    console.debug('zap endpeoint', zapInfo)
    const zapRequestArgs = {
      profile: channelProfile.pubkey,
      event: null, // event and comment will be added in chat zap
      amount: 1000,
      comment: '',
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
    } catch (e: any) {
      console.error('Failed to create zap request', e)
      return
    }
  }

  return (
    <button
      className={`${disabled() ? 'bg-stone-700' : 'bg-primary'}
      inline-flex h-8 items-center space-x-1 rounded px-3 py-1`}
      disabled={disabled()}
      onClick={handleZapClick}
    >
      {disabled() ? (
        <LightningBoltDisabled height={20} widht={20} strokeWidth={1.5} />
      ) : (
        <LightningBolt height={20} width={20} strokeWidth={1.5} />
      )}
    </button>
  )
}

export const StreamBio = ({
  channelPubkey,
  channelProfile,
  channelProfileIsLoading,
  streamTitle,
  streamStatus,
}: {
  channelPubkey: string
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  streamTitle: string | null | undefined
  streamStatus: string | undefined
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
            <ZapButton channelProfile={channelProfile} channelProfileIsLoading={channelProfileIsLoading} />
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
