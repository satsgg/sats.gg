import { useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import CopyValueBar from './Settings/CopyBar'
import { decodeInvoice } from '~/utils/util'

const ZapInvoiceModule = ({ invoice, type }: { invoice: string; type: string }) => {
  const invoiceDecoded = useMemo(() => decodeInvoice(invoice), [invoice])

  return (
    <div
      className={`
        ${type === 'chat' ? 'w-full rounded' : ''} 
        ${type === 'stream' ? 'w-full rounded-l border-t border-l border-gray-500' : ''} 
        flex h-full min-w-0 flex-col items-center gap-4 overflow-y-auto bg-stone-900 p-4
      `}
    >
      <h1 className="text-center text-xl font-bold">Zap Invoice</h1>
      <a href={`lightning:${invoice}`} className="w-full">
        <QRCodeSVG
          value={invoice}
          level={'Q'}
          height={'100%'}
          width={'100%'}
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

      <CopyValueBar value={invoice} />
      <p>Amount: {invoiceDecoded?.amount && new Intl.NumberFormat().format(invoiceDecoded.amount / 1000)} sats</p>
    </div>
  )
}

export default ZapInvoiceModule
