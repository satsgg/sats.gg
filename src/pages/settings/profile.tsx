import Profile from '~/components/Settings/Profile2'
import type { NextPageWithLayout } from '~/pages/_app'
import getSettingsLayout from '~/components/Settings/Layout'

const ProfilePage: NextPageWithLayout = () => <Profile />

ProfilePage.getLayout = getSettingsLayout

export default ProfilePage
