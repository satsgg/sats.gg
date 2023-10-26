import { useState } from 'react'
import getPartyLayout from '~/components/Bitlab/Layout'
import { DEFAULT_RELAYS } from '~/store/settingsStore'
import { createZapEvent } from '~/utils/nostr'
import { QRCodeSVG } from 'qrcode.react'
import CheckmarkSVG from '~/svgs/checkmark.svg'
import ClipboardSVG from '~/svgs/clipboard.svg'
import useFetchZap from '~/components/Bitlab/useFetchZap'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { parseVideoId, streamIdentifier, streamPubkey, zapInfo } from '~/components/Bitlab/util'

export default function Party() {
  const [invoice, setInvoice] = useState<string | null>(null)
  const [showCopied, setShowCopied] = useState(false)

  useFetchZap(invoice, () => {
    setInvoice(null)
  })

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({ video: z.string(), amount: z.number().min(1) }),
    defaultValues: {
      video: 'https://youtube.com/watch?v=xzpndHtdl9A',
      amount: 10,
    },
  })

  const onSubmit = async (data: { video: string; amount: number }) => {
    // parse video
    console.log('submitted video', data.video)
    console.log('submitted amount', data.amount)
    const videoId = parseVideoId(data.video)
    if (!videoId) {
      setError('video', { message: 'Invalid YouTube video URL!' })
      return
    }
    await createZapInvoice(data.video, data.amount)
  }

  // TODO: Form for video, amount
  // const videoId = 'https://youtube.com/watch?v=xzpndHtdl9A'
  // const amount = 10

  // TODO: Pass youtube url param and amount
  const createZapInvoice = async (video: string, amount: number) => {
    const amountMilliSats = amount * 1000
    const zapRequestArgs = {
      profile: streamPubkey,
      event: null, // event and comment will be added in chat zap
      amount: amountMilliSats,
      comment: video,
      relays: DEFAULT_RELAYS,
    }

    try {
      const signedZapRequestEvent = await createZapEvent(
        zapRequestArgs,
        streamPubkey,
        streamIdentifier,
        process.env.NEXT_PUBLIC_PARTY_KEY!,
      )
      console.log('signedZapRequestEvent', signedZapRequestEvent)
      if (!signedZapRequestEvent) throw new Error('Failed to sign zap')

      const encodedZapRequest = encodeURI(JSON.stringify(signedZapRequestEvent))
      const zapRequestHttp = `${zapInfo.callback}?amount=${amountMilliSats}&nostr=${encodedZapRequest}&lnurl=${zapInfo.lnurl}`
      console.debug('zapRequestHttp', zapRequestHttp)

      // separate function for fetching invoice? store invoice?
      const resObj = await fetch(
        `${zapInfo.callback}?amount=${zapRequestArgs.amount}&nostr=${encodedZapRequest}&lnurl=${zapInfo.lnurl}`,
      ).then((res) => res.json())

      console.debug('resObj', resObj)
      if (resObj.status === 'ERROR') throw new Error(resObj.reason)

      const { pr: invoice } = resObj

      console.log('Success! Invoice: ', invoice)
      setInvoice(invoice)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUrlStringClick = async () => {
    await navigator.clipboard.writeText(invoice!)
    setShowCopied(true)
    setTimeout(() => {
      setShowCopied(false)
    }, 2000)
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-y-4 p-4 text-white">
      {!invoice ? (
        <>
          <h1>Submit a video to be played on stream!</h1>
          <form className="flex w-full flex-col" spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
            <label>YouTube video link</label>
            <input
              className={`${
                errors.video ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-primary'
              } focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic  focus:bg-slate-900 focus:outline-none`}
              type="text"
              placeholder="YouTube link"
              autoComplete="off"
              {...register('video')}
            />
            {errors.video && <p className="text-sm ">{errors.video.message}</p>}

            <label className="pt-4">Satoshis</label>
            <input
              className={`${
                errors.amount ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-primary'
              } focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic  focus:bg-slate-900 focus:outline-none`}
              type="number"
              autoComplete="off"
              {...register('amount', {
                valueAsNumber: true,
              })}
            />
            {errors.amount && <p className="text-sm ">{errors.amount.message}</p>}
          </form>
          <button className="w-full rounded border border-white px-2 py-1" onClick={handleSubmit(onSubmit)}>
            Submit video
          </button>
        </>
      ) : (
        <>
          <a href={`lightning:${invoice}`}>
            <QRCodeSVG value={invoice} level={'Q'} size={300} includeMargin className="rounded" />
          </a>

          <div className="w-max-full inline-flex w-full">
            <input
              type="button"
              className="min-w-0 rounded-l border-2 border-r border-white p-1"
              onClick={handleUrlStringClick}
              value={invoice}
            />
            <button className="rounded-r border-2 border-white p-2 text-white" onClick={handleUrlStringClick}>
              {showCopied ? (
                <CheckmarkSVG width={24} height={24} strokeWidth={1.5} />
              ) : (
                <ClipboardSVG width={24} height={24} strokeWidth={1.5} />
              )}
            </button>
          </div>

          <button className="rounded border border-white px-2 py-2" onClick={() => setInvoice(null)}>
            Go back
          </button>
        </>
      )}
    </div>
  )
}

Party.getLayout = getPartyLayout
