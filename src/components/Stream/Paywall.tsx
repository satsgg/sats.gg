import { Dispatch, MutableRefObject, SetStateAction, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Exit from '~/svgs/x.svg'
import type Player from 'video.js/dist/types/player'
import { Lsat } from 'lsat-js'
import { QRCodeSVG } from 'qrcode.react'
import CopyValueBar from '../Settings/CopyBar'

type QualityLevel = {
  bitrate: number
  framerate?: number
  price?: number
  height: number
  width: number
  resolvedUri: string
}

type InvoiceStatus = {
  preimage: string | null
  status: string
}

const defaultMinutes = 1

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const Paywall = ({
  playerRef,
  qualitySelectorRef,
  qualityLevels,
  setL402,
  close,
}: {
  playerRef: MutableRefObject<Player | null>
  qualitySelectorRef: MutableRefObject<null>
  qualityLevels: QualityLevel[]
  setL402: Dispatch<SetStateAction<Lsat | null>>
  close: () => void
}) => {
  const [modal, setModal] = useState<'quality' | 'duration' | 'payment' | 'none'>('quality')
  const [selectedQuality, setSelectedQuality] = useState(qualityLevels[0])
  const [minutes, setMinutes] = useState(defaultMinutes)
  const [price, setPrice] = useState(0) // total price in millisatoshis per second for duration
  const [l402Challenge, setL402Challenge] = useState<Lsat | null>(null)
  // TODO: Skip quality selection if a one was chosen via selector

  useEffect(() => {
    const selectedQualityPrice = selectedQuality?.price
    if (!selectedQualityPrice) return
    setPrice(selectedQualityPrice * minutes * 60)
  }, [minutes])

  const requestInvoice = async () => {
    const uri = selectedQuality?.resolvedUri
    if (!uri) return
    console.debug('requesting invoice')
    console.debug('uri', selectedQuality.resolvedUri)
    let challenge
    try {
      let res = await fetch(`${uri}?t=${minutes * 60}`)
      if (res.status !== 402) throw new Error('Some other shit happened')
      let challengeHeader = res.headers.get('WWW-Authenticate')
      if (!challengeHeader) throw new Error('No challenge header')
      challenge = Lsat.fromHeader(challengeHeader)
      setL402Challenge(challenge)
      setModal('payment')
    } catch (e: any) {
      console.error('somethign else happened')
    }
  }

  useEffect(() => {
    const uri = selectedQuality?.resolvedUri
    if (!l402Challenge || !uri) return
    const url = new URL(uri)
    const baseUrl = `${url.protocol}//${url.host}`

    const awaitPayment = async () => {
      let payment: InvoiceStatus | null = null
      let failedAttempts = 0
      while (true) {
        try {
          let paymentRes = await fetch(`${baseUrl}/.well-known/bolt11?h=${l402Challenge.paymentHash}`)
          payment = await paymentRes.json()
          if (payment && payment.status === 'SETTLED') break
          await sleep(1000)
        } catch (e: any) {
          console.error('error fetching payment status', e)
          if (failedAttempts > 3) {
            console.error('timed out fetching payment status, closing')
            return
          }
          failedAttempts = failedAttempts + 1
        }
      }
      const l402 = l402Challenge // deep copy?
      if (!payment.preimage) {
        console.error('BUG')
        return
      }
      l402.setPreimage(payment.preimage)
      console.debug('finished l402', l402)
      setL402(l402)
      close()
      // TODO: Set player to quality level chosen
    }
    awaitPayment()
  }, [l402Challenge])

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
            payment: (
              <div className="flex max-w-full flex-col gap-4">
                <div className="flex w-full items-center">
                  <div className="w-1/12">
                    <button onClick={() => setModal('duration')}>Back</button>
                  </div>
                  <h1 className="w-10/12 text-center text-xl font-bold">Invoice</h1>
                  <div className="w-1/12">
                    <button onClick={() => close()}>
                      <Exit height={25} width={25} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <div className="relative flex flex-col items-center justify-center gap-2">
                  <a href={`lightning:${l402Challenge?.invoice || ''}`} className="w-1/2">
                    <QRCodeSVG
                      value={l402Challenge?.invoice || ''}
                      level={'Q'}
                      height={'100%'}
                      width={'100%'}
                      includeMargin
                      className="rounded border-8 border-primary-500"
                    />
                  </a>
                  <CopyValueBar value={l402Challenge?.invoice || ''} />
                  <p>
                    Amount:{' '}
                    {l402Challenge?.invoiceAmount && new Intl.NumberFormat().format(l402Challenge.invoiceAmount)} sats
                  </p>
                </div>
              </div>
            ),
            none: null,
          }[modal]
        }
      </div>
    </div>
  )
}
export default Paywall
