import { t } from '../trpc'
import { z } from 'zod'
import { prisma } from '~/server/prisma'
import { TRPCError } from '@trpc/server'
import { isAuthed } from '~/server/middlewares/authed'
import { StreamStatus } from '@prisma/client'
import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_EXPIRE_TIME_SECONDS = 60 * 60 * 6 // 6 hour
const VIEWER_COUNT_EXPIRE_TIME_SECONDS = 15

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
            streamId: true,
            playbackId: true,
            streamStatus: true,
            muxJwt: true,
            muxJwtCreatedAt: true,
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

      const now = new Date()
      const expTime = user.muxJwtCreatedAt
      expTime.setSeconds(expTime.getSeconds() + JWT_EXPIRE_TIME_SECONDS)

      let newJwtToken: string | null = null

      if (!user.muxJwt || now > expTime) {
        const jwtData = {
          sub: user.streamId,
          aud: 'live_stream_id',
          exp: Math.floor(now.getTime() / 1000) + JWT_EXPIRE_TIME_SECONDS,
        }
        if (!process.env.MUX_SIGNING_KEY_ID)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Missing MUX_SIGNING_KEY_ID' })
        if (!process.env.MUX_SIGNING_KEY_BASE64)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Missing MUX_SIGNING_KEY_BASE64' })

        const privatekey = Buffer.from(process.env.MUX_SIGNING_KEY_BASE64, 'base64')

        const jwtOptions: SignOptions = {
          algorithm: 'RS256',
          header: {
            alg: 'RS256',
            kid: process.env.MUX_SIGNING_KEY_ID,
          },
        }

        newJwtToken = jwt.sign(jwtData, privatekey, jwtOptions)
      }

      let newViewerCount: number | null = null
      if (user.streamStatus === StreamStatus.ACTIVE) {
        const viewerCountExpTime = user.viewerCountUpdatedAt
        viewerCountExpTime.setSeconds(viewerCountExpTime.getSeconds() + VIEWER_COUNT_EXPIRE_TIME_SECONDS)

        if (now > viewerCountExpTime) {
          newViewerCount = await fetch(`https://stats.mux.com/counts?token=${newJwtToken ? newJwtToken : user.muxJwt}`)
            .then((r) => r.json())
            .then((r) => r.data[0].viewers)
            .catch((error) => {
              console.error('Failed to get viewer count', error)
              newViewerCount = null
              // throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
            })
        }
      }

      if (newJwtToken || newViewerCount !== null) {
        return await prisma.user
          .update({
            where: { publicKey: input.pubkey },
            data: {
              ...(newJwtToken ? { muxJwt: newJwtToken } : {}),
              ...(newJwtToken ? { muxJwtCreatedAt: now } : {}),
              ...(newViewerCount !== null ? { viewerCount: newViewerCount } : {}),
              ...(newViewerCount !== null ? { viewerCountUpdatedAt: now } : {}),
            },
            select: {
              streamId: true,
              playbackId: true,
              streamStatus: true,
              viewerCount: true,
              chatChannelId: true,
              streamTitle: true,
            },
          })
          .catch((error) => {
            console.error('Update user jwt / viewer count error', error)
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
          })
      }

      return {
        streamId: user.streamId,
        playbackId: user.playbackId,
        streamStatus: user.streamStatus,
        viewerCount: user.viewerCount,
        chatChannelId: user.chatChannelId,
        streamTitle: user.streamTitle,
      }
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
      // console.debug('mux webook input', input)
      if (input.type == 'video.live_stream.active' || input.type == 'video.live_stream.idle') {
        // update user stream status
        const status: StreamStatus = input.type === 'video.live_stream.active' ? StreamStatus.ACTIVE : StreamStatus.IDLE

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
