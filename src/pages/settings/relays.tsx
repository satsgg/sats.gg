import Relays from '~/components/Settings/Relays'
import type { NextPageWithLayout } from '~/pages/_app'
import getSettingsLayout from '~/components/Settings/Layout'

const RelaysPage: NextPageWithLayout = () => <Relays />

RelaysPage.getLayout = getSettingsLayout

export default RelaysPage
