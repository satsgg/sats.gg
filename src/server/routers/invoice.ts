import { z } from 'zod'
import { prisma } from '../prisma'
import { t } from '../trpc'

export const invoiceRouter = t.router({
  getInvoiceById: t.procedure.input(z.string()).query(async ({ input }) => {
    const invoice = await prisma.invoice.findUnique({ where: { id: input } })
    return invoice
  }),
})
