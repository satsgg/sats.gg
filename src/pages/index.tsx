import { NextPageWithLayout } from './_app'

const IndexPage: NextPageWithLayout = () => {
  return (
    <div className="flex w-full grow flex-col items-center">
      <div className={'no-scrollbar mt-4 flex w-3/5 grow justify-center overflow-y-auto'}>
        <div className="h-screen w-full border-4 border-cyan-500 bg-slate-500" />
      </div>
    </div>
  )
}

export default IndexPage
