import { t } from '../trpc'
import { z } from 'zod'
import { prisma } from '~/server/prisma'
import { TRPCError } from '@trpc/server'
import { isAuthed } from '~/server/middlewares/authed'
import { StreamStatus } from '@prisma/client'

export const userRouter = t.router({
  getUser: t.procedure
    .input(
      z.object({
        pubkey: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const user = await prisma.user
        .findUnique({
          where: {
            publicKey: input.pubkey,
          },
          select: {
            streamStatus: true,
            viewerCount: true,
            viewerCountUpdatedAt: true,
            chatChannelId: true,
            streamTitle: true,
            defaultZapAmount: true,
          },
        })
        .catch((error) => {
          console.log(error)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        })
      if (!user) return null

      return {
        streamStatus: user.streamStatus,
        viewerCount: user.viewerCount,
        chatChannelId: user.chatChannelId,
        streamTitle: user.streamTitle,
      }
    }),

  setChatChannelId: t.procedure
    .use(isAuthed)
    .input(z.object({ chatChannelId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await prisma.user
        .update({
          where: { publicKey: ctx.user.publicKey },
          data: { chatChannelId: input.chatChannelId },
        })
        .catch((error) => {
          console.debug('setChatChannelId error', error)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        })
    }),

  updateStreamTitle: t.procedure
    .use(isAuthed)
    .input(z.object({ streamTitle: z.string().max(128) }))
    .mutation(async ({ input, ctx }) => {
      return await prisma.user
        .update({
          where: { publicKey: ctx.user.publicKey },
          data: { streamTitle: input.streamTitle },
        })
        .catch((error) => {
          console.debug('updateStreamTitle error', error)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        })
    }),

  setDefaultZapAmount: t.procedure
    .use(isAuthed)
    .input(z.object({ defaultZapAmount: z.number().positive().max(2100000000) })) // idk max 21 BTC ha
    .mutation(async ({ input, ctx }) => {
      return await prisma.user
        .update({
          where: { publicKey: ctx.user.publicKey },
          data: { defaultZapAmount: input.defaultZapAmount },
        })
        .catch((error) => {
          console.debug('setDefaultZapAmount error', error)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        })
    }),

  deleteMe: t.procedure.use(isAuthed).mutation(async ({ ctx }) => {
    return await prisma.user
      .delete({
        where: { id: ctx.user.id },
      })
      .catch((error) => {
        console.log(error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      })
  }),
})
