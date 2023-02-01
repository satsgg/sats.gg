import useAuthStore from '~/store/useAuthStore'
import { Spinner } from '~/components/Spinner'
import ProfileSettings from '~/components/Settings/Profile'
import Settings from '~/components/Settings'

export default function ProfileSettingsWrapper({}) {
  const { user, setUser, status: authStatus } = useAuthStore()

  if (authStatus === 'unauthenticated') {
    return <p>You must be logged in to view this page</p>
  }

  if (user) {
    // return <ProfileSettings user={user} setUser={setUser} />
    return <Settings />
  }

  return (
    <div className={'w-full text-center'}>
      <Spinner />
    </div>
  )
}
