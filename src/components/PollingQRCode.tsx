import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Spinner } from '~/components/Spinner'
import { requestProvider } from 'webln'
import CheckmarkSVG from '~/svgs/checkmark.svg'
import ClipboardSVG from '~/svgs/clipboard.svg'

interface PollingQRCodeProps {
  bolt11: string
}

export const PollingQRCode = ({ bolt11 }: PollingQRCodeProps) => {
  const [showCopied, setShowCopied] = useState(false)
  const [webLNAvailable, setWebLNAvailable] = useState(false)
  const [parent] = useAutoAnimate<HTMLDivElement>()

  const handleUrlStringClick = async () => {
    await navigator.clipboard.writeText(bolt11)
    setShowCopied(true)
    setTimeout(() => {
      setShowCopied(false)
    }, 2000)
  }

  useEffect(() => {
    const doWebLNCheck = async () => {
      try {
        const webln = await requestProvider()
        await webln
          .getInfo()
          .then((info) => {
            setWebLNAvailable(true)
            return info
          })
          .catch((e) => {
            console.log('WebLn error: ', e)
          })
      } catch (e) {
        console.log('WebLn error: ', e)
      }
    }
    void doWebLNCheck()
  }, [])

  return (
    <div ref={parent} className={'flex flex-col items-center justify-center gap-8'}>
      <a href={`lightning:${bolt11}`}>
        <QRCodeSVG
          value={bolt11}
          level={'Q'}
          size={300}
          includeMargin
          className="rounded border-8 border-primary-500"
          // imageSettings={{
          //   src: LNAuthImg.src,
          //   height: 48,
          //   width: 48,
          //   excavate: true
          // }}
        />
      </a>

      <div className="w-max-full inline-flex w-full">
        <input
          type="button"
          className="min-w-0 rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary-500 focus:bg-slate-900"
          onClick={handleUrlStringClick}
          value={bolt11}
        />
        <button className="rounded-r bg-primary-500 p-2 text-white" onClick={handleUrlStringClick}>
          {showCopied ? (
            <CheckmarkSVG width={24} height={24} strokeWidth={1.5} />
          ) : (
            <ClipboardSVG width={24} height={24} strokeWidth={1.5} />
          )}
        </button>
      </div>

      <Spinner />
    </div>
  )
}
