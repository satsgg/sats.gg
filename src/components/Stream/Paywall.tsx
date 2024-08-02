import { MutableRefObject, useEffect, useState } from 'react'
import Button from '../Button'
import Exit from '~/svgs/x.svg'
import type Player from 'video.js/dist/types/player'

type QualityLevel = {
  bitrate: number
  framerate?: number
  price?: number
  height: number
  width: number
  resolvedUri: string
}

const defaultMinutes = 1
const Paywall = ({
  playerRef,
  qualitySelectorRef,
  qualityLevels,
  close,
}: {
  playerRef: MutableRefObject<Player | null>
  qualitySelectorRef: MutableRefObject<null>
  qualityLevels: QualityLevel[]
  close: () => void
}) => {
  const [modal, setModal] = useState<'quality' | 'duration' | 'payment' | 'none'>('quality')
  const [selectedQuality, setSelectedQuality] = useState(qualityLevels[0])
  const [minutes, setMinutes] = useState(defaultMinutes)
  const [price, setPrice] = useState(0) // total price in millisatoshis per second for duration

  useEffect(() => {
    // const selectedQualityPrice = qualityLevels[selectedQuality]?.price
    const selectedQualityPrice = selectedQuality?.price
    if (!selectedQualityPrice) return
    setPrice(selectedQualityPrice * minutes * 60)
  }, [minutes])

  const requestInvoice = async () => {
    const uri = selectedQuality?.resolvedUri
    if (!uri) return
    console.debug('requesting invoice')
    console.debug('uri', selectedQuality.resolvedUri)
    try {
      let res = await fetch(`${uri}?t=${minutes * 60}`)
      if (res.status !== 402) throw new Error('Some other shit happened')

      console.debug('WWW-Authenticate', res.headers.get('WWW-Authenticate'))
      // const l402 = Lsat.fromHeader(res.headers.get('WWW-Authenticate'));

      // return l402;
    } catch (e: any) {
      console.error('somethign else happened')
      // pop up error thing
    }
    // if (!l402Challenge) {
    //   console.error('handle l402Challenge error in ui');
    //   return;
    // }
    // setL402Challenge(l402Challenge);
    // setModal('payment');
  }

  return (
    <div className="absolute bottom-0 left-0 z-[101] flex h-full max-h-full w-full min-w-0 flex-col items-center justify-center gap-4 overflow-y-auto">
      <div className="bg-primary flex w-full flex-col rounded border bg-stone-900 p-4 xl:w-1/2">
        {
          {
            quality: (
              <>
                <div className="flex w-full items-center">
                  <div className="w-1/12"></div>
                  <h1 className="w-10/12 text-center text-xl font-bold">Select Quality</h1>
                  <div className="w-1/12">
                    <button onClick={() => close()}>
                      <Exit height={25} width={25} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {qualityLevels &&
                    qualityLevels.map((q, p) => (
                      <Button
                        key={p}
                        onClick={() => {
                          if (!q.price || q.price === 0) {
                            console.debug('free selected')
                            qualitySelectorRef.current._qualityButton.items[p].handleClick()
                            playerRef.current!.play()
                            close()
                            return
                          }
                          console.debug('setting price', 60 * q.price)
                          setPrice(q.price * minutes * 60) // default 1 min price
                          setSelectedQuality(q)
                          setModal('duration')
                        }}
                      >
                        {q.height}p, {q.price === 0 || !q.price ? 'free' : q.price + ' millisats/sec'}
                      </Button>
                    ))}
                </div>
              </>
            ),
            duration: (
              <div className="flex flex-col items-center gap-4">
                <div className="flex w-full items-center">
                  <div className="w-1/12">
                    <button onClick={() => setModal('quality')}>Back</button>
                  </div>
                  <h1 className="w-10/12 text-center text-xl font-bold">Select Duration</h1>
                  <div className="w-1/12">
                    <button onClick={() => close()}>
                      <Exit height={25} width={25} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => setMinutes(1)}>1 minute</Button>
                  <Button onClick={() => setMinutes(10)}>10 minutes</Button>
                  <Button onClick={() => setMinutes(30)}>30 minutes</Button>
                  <Button onClick={() => setMinutes(60)}>60 minutes</Button>
                </div>
                <div>
                  <p>Duration: {minutes} minutes</p>
                  <p>Cost: {Math.ceil(price / 1000)} sats</p>
                  <Button onClick={requestInvoice}>Purchase</Button>
                </div>
              </div>
            ),
            payment: <div> hi</div>,
            none: null,
          }[modal]
        }
      </div>
    </div>
  )
}
export default Paywall
