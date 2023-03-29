import Image, { StaticImageData } from 'next/image'
import { useEffect, useState } from 'react'

export default function ImageFallback({ src, fallbackSrc, ...rest }: { src: string; fallbackSrc: StaticImageData }) {
  const [imgSrc, set_imgSrc] = useState<string | StaticImageData>(src)

  useEffect(() => {
    set_imgSrc(src)
  }, [src])

  return (
    <Image
      {...rest}
      src={imgSrc}
      onLoadingComplete={(result) => {
        if (result.naturalWidth === 0) {
          // Broken image
          set_imgSrc(fallbackSrc)
        }
      }}
      onError={() => {
        set_imgSrc(fallbackSrc)
      }}
    />
  )
}
