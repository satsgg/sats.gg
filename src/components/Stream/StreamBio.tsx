import FollowButton from './FollowButton'
import ZapButton from '~/components/ZapButton'
import { displayName } from '~/utils/nostr'
import { UserMetadataStore } from '~/store/db'
import { StreamStatus } from '@prisma/client'
import HaloProfileImg from '../HaloProfileImg'
import LiveUser from '~/svgs/live-user.svg'
import { fmtViewerCnt } from '~/utils/util'

export const StreamBio = ({
  channelPubkey,
  channelProfile,
  channelProfileIsLoading,
  streamTitle,
  streamStatus,
  zapInvoice,
  setZapInvoice,
  setShowZapModule,
  viewerCount,
}: {
  channelPubkey: string
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  streamTitle: string | null | undefined
  streamStatus: string | undefined
  zapInvoice: string | null
  setZapInvoice: (invoice: string | null) => void
  setShowZapModule: (show: boolean) => void
  viewerCount: number | null | undefined
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
              liveBorder={streamStatus === StreamStatus.ACTIVE}
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
            {viewerCount && streamStatus === StreamStatus.ACTIVE && (
              <div className="mr-2 flex items-center justify-end">
                <LiveUser className="h-5 w-5 stroke-red-400" strokeWidth={2.5} />
                <span className="font-semibold text-red-400">{fmtViewerCnt(viewerCount, false)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="about" className="hidden rounded bg-stone-800 p-12 sm:block">
        <p className="font-semi text-xl text-white">About {channelProfile?.name}</p>
        <p className="font-semi text-lg text-white">{channelProfile?.about}</p>
      </div>

      {/* <div className="hidden h-screen w-full border-4 border-cyan-500 sm:block" /> */}
    </div>
  )
}
