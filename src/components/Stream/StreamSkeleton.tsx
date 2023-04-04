import { Spinner } from '../Spinner'

const StreamSkeleton = () => {
  return (
    <div className="flex aspect-video h-full w-full content-center justify-center bg-black">
      <Spinner height={6} width={6} />
    </div>
  )
}

export default StreamSkeleton
