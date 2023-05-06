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
      return await prisma.user
        .findUnique({
          where: {
            publicKey: input.pubkey,
          },
          select: {
            playbackId: true,
            streamStatus: true,
            chatChannelId: true,
            streamTitle: true,
          },
        })
        .catch((error) => {
          console.log(error)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        })
    }),

  refreshStreamKey: t.procedure.use(isAuthed).mutation(async ({ ctx }) => {
    const muxResponse = await fetch(`https://api.mux.com/video/v1/live-streams/${ctx.user.streamId}/reset-stream-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Accept: 'application/json;charset=utf-8',
        Authorization:
          'Basic ' + Buffer.from(process.env.MUX_ACCESS_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64'),
      },
    })
      .then((r) => r.json())
      .catch((error) => {
        console.log(error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      })
    console.log('refreshStreamKey response', muxResponse)

    return await prisma.user
      .update({
        where: { id: ctx.user.id },
        data: { streamKey: muxResponse.data.stream_key },
      })
      .catch((error) => {
        console.log(error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      })
  }),

  muxEvent: t.procedure
    .meta({ openapi: { method: 'POST', path: '/webhooks/mux' } })
    .input(
      z.object({
        type: z.string(),
        // id: z.string().uuid(),
        id: z.string(),
        data: z.any(),
        // data: z.object({ id: z.string().uuid() })
        // data: z.object({
        //   status: z.string(),
        //   id: z.string().uuid()
        // })

        // }).catchall(unknown: z.object()),
      }),
      // z.record(),
    )
    .output(z.any())
    .query(async ({ input }) => {
      console.log('mux webook input', input)
      if (input.type == 'video.live_stream.active' || input.type == 'video.live_stream.idle') {
        // update user stream status
        const status: StreamStatus = input.type === 'video.live_stream.active' ? 'ACTIVE' : 'IDLE'

        await prisma.user
          .update({
            where: { streamId: input.data.id },
            data: { streamStatus: status },
          })
          .catch((error) => {
            console.log(error)
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
          })
      }
      return { status: 'OK' }
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
