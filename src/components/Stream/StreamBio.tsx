import FollowButton from './FollowButton'
import ZapButton from '~/components/ZapButton'
import { displayName } from '~/utils/nostr'
import { UserMetadataStore } from '~/store/db'
import HaloProfileImg from '../HaloProfileImg'
import Participant from './Participant'

export const StreamBio = ({
  channelPubkey,
  channelProfile,
  channelProfileIsLoading,
  streamTitle,
  streamStatus,
  participants,
  zapInvoice,
  setZapInvoice,
  setShowZapModule,
}: {
  channelPubkey: string
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  streamTitle: string | null | undefined
  streamStatus: string | undefined
  participants: string[] | undefined
  zapInvoice: string | null
  setZapInvoice: (invoice: string | null) => void
  setShowZapModule: (show: boolean) => void
}) => {
  return (
    <div
      id="streamBioWrapper"
      className="flex grow flex-col gap-4 border-b border-gray-500 px-2 py-2 md:border-0 lg:px-5 lg:py-2.5"
    >
      <div id="profile" className="flex gap-2">
        <div className="h-14 w-14 shrink-0 md:mt-2 md:h-[4.5rem] md:w-[4.5rem]">
          {channelProfileIsLoading ? (
            <div className="h-full w-full rounded-[50%] bg-gray-600" />
          ) : (
            <HaloProfileImg
              pubkey={channelPubkey}
              picture={channelProfile?.picture}
              liveBorder={streamStatus === 'live'}
            />
          )}
        </div>

        <div className="flex w-full min-w-0 justify-between">
          <div className="flex min-w-0 flex-col md:mt-2">
            <span className="min-h-0 truncate text-lg font-bold text-white">
              {!channelProfileIsLoading && displayName(channelPubkey, channelProfile)}
            </span>
            {streamTitle && (
              <span className="text-md min-h-0 truncate break-words text-white xl:whitespace-normal">
                {streamTitle}
              </span>
            )}
            {participants && participants?.length !== 0 && <Participant pubkey={participants[0]} />}
          </div>

          <div className="flex flex-col gap-1">
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
      </div>

      <div id="about" className="hidden rounded bg-stone-800 p-12 sm:block">
        <p className="font-semi text-xl text-white">About {channelProfile?.name}</p>
        <p className="font-semi whitespace-pre-line break-words text-lg text-white">{channelProfile?.about}</p>
      </div>

      {/* <div className="hidden h-screen w-full border-4 border-cyan-500 sm:block" /> */}
    </div>
  )
}
