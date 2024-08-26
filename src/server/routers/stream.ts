import { t } from '../trpc'
import { prisma } from '~/server/prisma'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@prisma/client'
import { isAuthed } from '../middlewares/authed'
import { z } from 'zod'

const qualityNameMap = {
  '1080p60fps': { height: 1080, framerate: 60 },
  '720p60fps': { height: 720, framerate: 60 },
  '720p30fps': { height: 720, framerate: 30 },
  '480p30fps': { height: 480, framerate: 30 },
  '360p30fps': { height: 360, framerate: 30 },
  '160p30fps': { height: 160, framerate: 30 },
}

const createStreamSchema = z.object({
  duration: z.number(),
  lightningAddress: z.string().optional(),
  qualities: z.array(
    z.object({
      name: z.enum(['1080p60fps', '720p60fps', '720p30fps', '480p30fps', '360p30fps', '160p30fps']),
      price: z.number(),
    }),
  ),
})

export const streamRouter = t.router({
  createStream: t.procedure
    .use(isAuthed)
    .input(createStreamSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.qualities.some((q) => q.price > 0) && !input.lightningAddress) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lightning address is required' })
      }

      const data: Prisma.StreamCreateInput = {
        user: {
          connect: { id: ctx.user.id },
        },
        duration: input.duration,
        lightningAddress: input.lightningAddress || null,
        streamKey: crypto.randomUUID(),
        variants: {
          create: input.qualities.map((q) => ({
            ...qualityNameMap[q.name],
            price: q.price,
          })),
        },
      }
      const stream = await prisma.stream.create({ data: data }).catch((error) => {
        console.error('Error creating stream', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      })

      try {
        const pricerResponse = await fetch(process.env.PRICER_URL + '/api/v1/stream/invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price: 10000, streamId: stream.id }),
        })

        if (!pricerResponse.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create invoice! status: ${pricerResponse.status}`,
          })
        }

        const invoiceData: { paymentRequest: string; invoiceId: string } = await pricerResponse.json()

        // Handle the invoice data as needed
        return { streamId: stream.id, paymentRequest: invoiceData.paymentRequest, invoiceId: invoiceData.invoiceId }
        // return { paymentRequest: invoiceData.paymentRequest, invoiceId: invoiceData.invoiceId }
        // return await prisma.invoice.findUnique({ where: { id: invoiceData.invoiceId } })
      } catch (error) {
        console.error('Error creating invoice:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invoice for stream',
        })
      }
    }),

  getStreamById: t.procedure.input(z.string()).query(async ({ input }) => {
    return await prisma.stream.findUnique({ where: { id: input } }).catch((error) => {
      console.error('Error getting stream', error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
    })
  }),
})
