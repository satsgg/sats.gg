import { useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import CopyValueBar from './Settings/CopyBar'
import { decodeInvoice } from '~/utils/util'
import Exit from '~/svgs/x.svg'

const ZapInvoiceModule = ({ invoice, type, close }: { invoice: string; type: string; close: () => void }) => {
  const invoiceDecoded = useMemo(() => decodeInvoice(invoice), [invoice])

  return (
    <div
      className={`
        ${type === 'chat' ? 'w-full rounded' : ''} 
        ${type === 'stream' ? 'w-full rounded-l border-t border-l border-gray-500' : ''} 
        flex h-full min-w-0 flex-col items-center gap-4 overflow-y-auto bg-stone-900 p-4
      `}
    >
      <div className="flex w-full items-center">
        <div className="w-1/12"></div>
        <h1 className="w-10/12 text-center text-xl font-bold">Zap Invoice</h1>
        <div className="w-1/12">
          <button onClick={() => close()}>
            <Exit height={25} width={25} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <a href={`lightning:${invoice}`} className="w-full">
        <QRCodeSVG
          value={invoice}
          level={'Q'}
          height={'100%'}
          width={'100%'}
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

      <CopyValueBar value={invoice} />
      <p>Amount: {invoiceDecoded?.amount && new Intl.NumberFormat().format(invoiceDecoded.amount / 1000)} sats</p>
    </div>
  )
}

export default ZapInvoiceModule
