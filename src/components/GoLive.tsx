import { Fragment, useEffect, useState } from 'react'
import Button from './Button'
import { trpc } from '~/utils/trpc'
import { useRouter } from 'next/router'
import { QRCodeSVG } from 'qrcode.react'
import CopyValueBar from './Settings/CopyBar'
import { InvoiceStatus, StreamStatus } from '@prisma/client'

const supportedQualities = {
  '1080p60fps': {
    height: 1080,
    framerate: 60,
    baseUploadMsPerSecond: 1000,
    baseDownloadMsPerSecond: 100,
  },
  '720p60fps': {
    height: 720,
    framerate: 60,
    baseUploadMsPerSecond: 1000,
    baseDownloadMsPerSecond: 100,
  },
  '720p30fps': {
    height: 720,
    framerate: 30,
    baseUploadMsPerSecond: 1000,
    baseDownloadMsPerSecond: 100,
  },
  '480p30fps': {
    height: 480,
    framerate: 30,
    baseUploadMsPerSecond: 1000,
    baseDownloadMsPerSecond: 100,
  },
  '360p30fps': {
    height: 360,
    framerate: 30,
    baseUploadMsPerSecond: 1000,
    baseDownloadMsPerSecond: 100,
  },
  '160p30fps': {
    height: 160,
    framerate: 30,
    baseUploadMsPerSecond: 1000,
    baseDownloadMsPerSecond: 100,
  },
} as const

type QualityName = keyof typeof supportedQualities

const GoLive = ({ close }: { close: () => void }) => {
  const router = useRouter()
  const [qualities, setQualities] = useState(() =>
    Object.fromEntries(
      Object.entries(supportedQualities).map(([name, quality]) => [
        name,
        { ...quality, name, selected: false, price: 0 },
      ]),
    ),
  )
  const [view, setView] = useState<'quality' | 'viewerPrice' | 'payment'>('quality')
  const [duration, setDuration] = useState(600) // seconds
  const [invoice, setInvoice] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [lightningAddress, setLightningAddress] = useState<string | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)
  const createStream = trpc.stream.createStream.useMutation({
    onSuccess: (data) => {
      // close()
      console.debug('Stream invoice created', data)
      // router.push({ pathname: '/dashboard', query: { streamId: data.streamId } })
      setStreamId(data.streamId)
      setInvoice(data.paymentRequest)
      setInvoiceId(data.invoiceId)
      setView('payment')
    },
    onError: (err) => {
      console.error('Failed to create stream', err)
      // show error
    },
  })

  const { data: invoiceData, isLoading } = trpc.invoice.getInvoiceById.useQuery(invoiceId || '', {
    refetchOnWindowFocus: false,
    refetchInterval: 2 * 1000,
    enabled: !!invoiceId,
  })

  useEffect(() => {
    if (!invoiceData || !streamId) return
    console.debug('Invoice data', invoiceData)
    if (invoiceData.status === InvoiceStatus.SETTLED) {
      close()
      router.push({ pathname: '/dashboard', query: { streamId: streamId } })
      setStreamId(null)
      setInvoice(null)
      setInvoiceId(null)
    }
  }, [invoiceData, streamId])

  return (
    <div className="flex flex-col gap-4">
      {view === 'quality' && (
        <Fragment>
          <h2>Select quality levels</h2>
          <div className="flex flex-col gap-1">
            {Object.entries(qualities).map(([name, quality]) => (
              <div key={name} className="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  checked={quality.selected}
                  onChange={() =>
                    setQualities((prev) => ({
                      ...prev,
                      [name]: { ...quality, selected: !quality.selected },
                    }))
                  }
                />
                <p>
                  {quality.height}p {quality.framerate}fps, {quality.baseUploadMsPerSecond} msats/sec
                </p>
              </div>
            ))}
          </div>
          <h2>Select duration</h2>
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min="600"
              max="28800"
              step="600"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full"
            />
            <p>
              {duration >= 3600
                ? `${Math.floor(duration / 3600)} hours ${Math.floor((duration % 3600) / 60)} minutes`
                : `${Math.floor(duration / 60)} minutes`}
            </p>
          </div>
          <p>
            Upload price:{' '}
            {Object.entries(qualities)
              .filter(([_, q]) => q.selected)
              .reduce((total, [_, q]) => total + (q.baseUploadMsPerSecond * duration) / 1000, 0)
              .toFixed(0)}{' '}
            sats
          </p>
          <Button
            className="mt-4"
            disabled={!Object.values(qualities).some((q) => q.selected)}
            onClick={() => setView('viewerPrice')}
          >
            Set Viewer Price
          </Button>
        </Fragment>
      )}
      {view === 'viewerPrice' && (
        <Fragment>
          <h2>Set viewer price</h2>
          <div className="flex flex-col gap-4">
            {Object.entries(qualities)
              .filter(([_, q]) => q.selected)
              .map(([name, quality]) => (
                <div className="flex flex-col gap-2" key={name}>
                  <div className="flex flex-row items-center gap-2">
                    <p>
                      {quality.height}p {quality.framerate}fps, {quality.baseDownloadMsPerSecond} msats/sec
                    </p>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <input
                      name={`price-${name}`}
                      placeholder="Enter price in msats"
                      type="text"
                      value={quality.price || ''}
                      onChange={(e) => {
                        const newPrice = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                        setQualities((prev) => ({
                          ...prev,
                          [name]: { ...quality, price: newPrice },
                        }))
                      }}
                      className="focus:shadow-outline resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-1 px-2 text-sm leading-tight text-white shadow placeholder:italic focus:border-primary-500 focus:bg-slate-900 focus:outline-none"
                    />
                    <p className="text-sm">msats/sec</p>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex flex-col">
            <h3>Lighting address</h3>
            <input
              type="text"
              placeholder="Enter your lightning address"
              value={lightningAddress || ''}
              onChange={(e) => setLightningAddress(e.target.value)}
              className="focus:shadow-outline resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-1 px-2 text-sm leading-tight text-white shadow placeholder:italic focus:border-primary-500 focus:bg-slate-900 focus:outline-none"
            />
          </div>
          <Button
            onClick={() => {
              const hasPrice = Object.values(qualities).some((q) => q.selected && q.price > 0)
              if (hasPrice && !lightningAddress) {
                alert('Please enter a lightning address to receive payments.')
                return
              }
              createStream.mutate({
                duration,
                lightningAddress: lightningAddress || undefined,
                qualities: Object.entries(qualities)
                  .filter(([_, q]) => q.selected)
                  .map(([name, { price }]) => ({
                    name: name as QualityName,
                    price,
                  })),
              })
            }}
          >
            Purchase Stream
          </Button>
        </Fragment>
      )}
      {view === 'payment' && (
        <div className="flex flex-col items-center justify-center gap-4">
          <h2>Awaiting payment</h2>
          <a href={`lightning:${invoice || ''}`} className="w-full">
            <QRCodeSVG
              value={invoice || ''}
              level={'Q'}
              height={'100%'}
              width={'100%'}
              includeMargin
              className="rounded border-8 border-primary-500"
            />
          </a>
          <CopyValueBar value={invoice || ''} />
        </div>
      )}
    </div>
  )
}

export default GoLive
