import { decode as invoiceDecode } from 'light-bolt11-decoder'
// import { bytesToHex } from '@noble/hashes/utils'

export const DEFAULT_ZAP_AMOUNT = 21

export interface InvoiceDetails {
  amount?: number
  expire?: number
  timestamp?: number
  description?: string
  // descriptionHash?: string
  paymentHash?: string
  expired: boolean
}

// TODO: Improve or change (think i fixed this in a diff project)
export function decodeInvoice(pr: string): InvoiceDetails | undefined {
  try {
    const parsed = invoiceDecode(pr)
    console.debug('parsed invoice', parsed)

    const amountSection = parsed.sections.find((a) => a.name === 'amount')
    const amount = amountSection ? Number(amountSection.value as number | string) : undefined

    const timestampSection = parsed.sections.find((a) => a.name === 'timestamp')
    const timestamp = timestampSection ? Number(timestampSection.value as number | string) : undefined

    const expirySection = parsed.sections.find((a) => a.name === 'expiry')
    const expire = expirySection ? Number(expirySection.value as number | string) : undefined
    const descriptionSection = parsed.sections.find((a) => a.name === 'description')?.value
    // const descriptionHashSection = parsed.sections.find((a) => a.name === 'description_hash')?.value
    const paymentHashSection = parsed.sections.find((a: { name: string }) => a.name === 'payment_hash')?.value
    const ret = {
      amount: amount,
      expire: timestamp && expire ? timestamp + expire : undefined,
      timestamp: timestamp,
      description: descriptionSection as string | undefined,
      // descriptionHash: descriptionHashSection ? bytesToHex(descriptionHashSection as Uint8Array) : undefined,
      paymentHash: paymentHashSection as string | undefined,
      expired: false,
    }
    if (ret.expire) {
      ret.expired = ret.expire < new Date().getTime() / 1000
    }
    return ret
  } catch (e) {
    console.error(e)
  }
}

export const MAX_MSG_LEN = 200
export const fmtMsg = (content: string) => {
  if (content.length > MAX_MSG_LEN) {
    return content.slice(0, MAX_MSG_LEN).trim() + '...'
  }
  return content
}

export const fmtViewerCnt = (viewerCount: number, compact: boolean = false) => {
  const compactNotation = { notation: 'compact' }
  let notation = undefined
  if (compact) notation = { notation: 'compact', maximumSignificantDigits: 3 }
  //@ts-ignore
  return Intl.NumberFormat('en', notation).format(viewerCount)
}

export const fmtNumber = (number: number, compact: boolean = false) => {
  let notation: Intl.NumberFormatOptions | undefined = undefined
  if (compact) notation = { notation: 'compact', maximumSignificantDigits: 3 }
  return Intl.NumberFormat('en', notation).format(number)
}

const BITCOIN_PRICE_USD = 100000

export const SATS_PER_USD = 100000000 / BITCOIN_PRICE_USD

export const formatUSD = (sats: number) => {
  const usd = sats / SATS_PER_USD
  return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
