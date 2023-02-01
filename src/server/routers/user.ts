import { t } from '../trpc'
import { z } from 'zod'
import { prisma } from '~/server/prisma'
import { editUserInput } from '~/components/Settings/Profile'
import { updateProfilePicInput } from '~/components/Settings/Profile'
import { getUser } from '~/pages/[channel]'
import jwt from 'jsonwebtoken'
import { TRPCError } from '@trpc/server'
import { isAuthed } from '~/server/middlewares/authed'
import { StreamStatus } from '@prisma/client'

export const userRouter = t.router({
  getUser: t.procedure.input(getUser).query(async ({ input, ctx }) => {
    return await prisma.user.findUnique({
      where: {
        userName: input.userName,
      },
      select: {
        id: true,
        userName: true,
        profileImage: true,
        bio: true,
        playbackId: true,
        streamStatus: true,
        // NOTE: Grab everything we need when loading a channel?
        // User might not be logged in...
        // so if we pass ctx.user.id it would be bad
        // Could run multiple queries here
        // have a service for follows etc.
        // return { ..user, follows: userFollowsChannel(user.id, channel.id)}
        // ctx.user.id ?  followedBy: {
        //   where: {
        //     followerId: 'yes'
        //   }
        // }
      },
    })
  }),
  listLatest: t.procedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input }) => {
      return await prisma.user.findMany({
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      })
    }),
  edit: t.procedure
    .use(isAuthed)
    .input(editUserInput)
    .mutation(async ({ input, ctx }) => {
      const user = await prisma.user
        .update({
          where: { id: ctx.user.id },
          data: { userName: input.userName, bio: input.bio },
          select: {
            id: true,
            streamId: true,
            publicKey: true,
            createdAt: true,
            updatedAt: true,
            userName: true,
          },
        })
        .catch((error) => {
          console.log(error)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
        })

      return { user: jwt.sign({ ...user }, process.env.JWT_SECRET ?? '') }
    }),
  updateProfilePic: t.procedure
    .use(isAuthed)
    .input(updateProfilePicInput)
    .mutation(async ({ input, ctx }) => {
      return await prisma.user
        .update({
          where: { id: ctx.user.id },
          data: { profileImage: input.base64EncodedImage },
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
        id: z.string().uuid(),
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
