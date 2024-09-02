import { z } from 'zod'
import { prisma } from '../prisma'
import { t } from '../trpc'
import { isAuthed } from '../middlewares/authed'
import { TRPCError } from '@trpc/server'

export const invoiceRouter = t.router({
  getInvoiceById: t.procedure
    .use(isAuthed)
    .input(z.string())
    .query(async ({ input }) => {
      return await prisma.channelInvoice.findUnique({ where: { id: input } }).catch((err) => {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.message })
      })
    }),
})
