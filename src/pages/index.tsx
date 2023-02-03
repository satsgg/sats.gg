import { NextPageWithLayout } from './_app'
import { UserList } from '~/components/UserList'

const IndexPage: NextPageWithLayout = () => {
  return (
    <div className="flex w-full grow flex-col items-center">
      <div className={'no-scrollbar mt-4 flex w-3/5 grow justify-center overflow-y-auto'}>
        <UserList />
      </div>
    </div>
  )
}

export default IndexPage
