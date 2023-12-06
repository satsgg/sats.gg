import { useState } from 'react'

const ThumbnailImg = ({ pubkey, thumbnail }: { pubkey: string; thumbnail: string | undefined }) => {
  const [hide, setHide] = useState(false)

  if (!thumbnail) return <div className="h-full w-full rounded bg-stone-800" />

  return (
    <>
      {!hide ? (
        <img
          src={thumbnail}
          alt={`profile image of ${pubkey}`}
          className="h-full w-full rounded"
          onError={(e) => {
            setHide(true)
          }}
        />
      ) : (
        <div className="h-full w-full rounded bg-stone-800" />
      )}
    </>
  )
}

export default ThumbnailImg
