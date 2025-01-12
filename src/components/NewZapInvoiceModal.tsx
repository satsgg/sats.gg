import { useMemo, useState } from 'react'
import { decodeInvoice, fmtNumber, formatUSD } from '~/utils/util'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Check, Copy, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface NewZapInvoiceModalProps {
  invoice: string
  closeZapModal: () => void
}

function NewZapInvoiceModal({ invoice, closeZapModal }: NewZapInvoiceModalProps) {
  const invoiceDecoded = useMemo(() => decodeInvoice(invoice), [invoice])
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(invoice)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="absolute inset-x-0 bottom-0 flex max-h-[70%] flex-col overflow-hidden border-t border-border bg-background">
      <ScrollArea className="flex-grow">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Zap Chat</h3>
            <Button variant="ghost" size="icon" onClick={closeZapModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-4 flex aspect-square items-center justify-center bg-muted">
            <a href={`lightning:${invoice}`} className="w-full">
              <QRCodeSVG
                value={invoice}
                level={'Q'}
                height={'100%'}
                width={'100%'}
                includeMargin
                className="rounded border-8 border-primary-500"
              />
            </a>
          </div>
          <div className="mb-2 flex">
            <Input readOnly value={invoice} className="flex-grow" />
            <Button variant="outline" className="ml-2" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Amount: {invoiceDecoded?.amount ? fmtNumber(invoiceDecoded.amount / 1000) : ''} sats (
            {invoiceDecoded?.amount ? formatUSD(invoiceDecoded.amount / 1000) : ''})
          </p>
        </div>
      </ScrollArea>
    </div>
  )
}

export default NewZapInvoiceModal
