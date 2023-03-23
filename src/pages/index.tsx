import { NextPageWithLayout } from './_app'

// i like bg-stone-600...
const DummyStreamCard = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video h-full w-full rounded bg-stone-800"></div>

      <div className="flex h-16 gap-2">
        <div className="">
          <div className="h-8 w-8 rounded-[50%] bg-stone-800"></div>
        </div>
        <div className="flex h-full w-full flex-col gap-2">
          <div className="h-full w-3/5 rounded bg-stone-800" />
          <div className="h-full w-1/2 rounded bg-stone-800" />
          <div className="h-full w-1/2 rounded bg-stone-800" />
        </div>
      </div>
    </div>
  )
}

const dummyLiveChannels = []

export default function IndexPage() {
  // TODO: Query for live channels

  const isLoading = true
  if (isLoading) {
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto px-8 py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {[...Array(21)].map((e, i) => (
          <DummyStreamCard key={i} />
        ))}
      </div>
      <div className="h-screen w-full border-4 border-cyan-500 bg-slate-500" />
    </div>
  )
}
