import StreamSettings from '~/components/Settings/Stream'
import type { NextPageWithLayout } from '~/pages/_app'
import getSettingsLayout from '~/components/Settings/Layout'

const StreamSettingsPage: NextPageWithLayout = () => <StreamSettings />

StreamSettingsPage.getLayout = getSettingsLayout

export default StreamSettingsPage
