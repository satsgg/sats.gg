import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Spinner } from '~/components/Spinner'
import { requestProvider } from 'webln'

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
          className="rounded border-8 border-primary"
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
          className="min-w-0 rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary focus:bg-slate-900"
          onClick={handleUrlStringClick}
          value={bolt11}
        />
        <button className="rounded-r bg-primary p-2 text-white" onClick={handleUrlStringClick}>
          {showCopied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
              />
            </svg>
          )}
        </button>
      </div>

      <Spinner />
    </div>
  )
}
