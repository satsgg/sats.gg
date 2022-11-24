import { t } from '../trpc'
import { prisma } from '~/server/prisma'
import { TRPCError } from '@trpc/server'
import { isAuthed } from '~/server/middlewares/authed'
import { followUserInput } from '~/components/Stream/StreamBio'

export const followRouter = t.router({
  getMyFollowedChannels: t.procedure.use(isAuthed).query(async ({ ctx }) => {
    try {
      const liveChannels = await prisma.follows.findMany({
        where: {
          followerId: ctx.user.id,
          following: {
            streamStatus: 'ACTIVE',
          },
        },
        include: {
          following: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
              streamStatus: true,
            },
          },
        },
        // orderBy: { : 'desc' }, order live by viewer cnt
      })

      const offlineChannels = await prisma.follows.findMany({
        where: {
          followerId: ctx.user.id,
          following: {
            streamStatus: 'IDLE',
          },
        },
        include: {
          following: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
              streamStatus: true,
            },
          },
        },
        // orderBy: { : 'desc' }, order by latest previous livestream
      })
      return liveChannels.concat(offlineChannels)
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found.',
      })
    }
  }),
  followUser: t.procedure
    .input(followUserInput)
    .use(isAuthed)
    .mutation(async ({ input, ctx }) => {
      try {
        await prisma.follows.create({
          data: {
            followerId: ctx.user.id,
            followingId: input.userId,
          },
          // already exists? what errors happen?
        })
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found.',
        })
      }
    }),
  unfollowUser: t.procedure
    .input(followUserInput)
    .use(isAuthed)
    .mutation(async ({ input, ctx }) => {
      try {
        await prisma.follows.delete({
          where: {
            followerId_followingId: {
              followerId: ctx.user.id,
              followingId: input.userId,
            },
          },
        })
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found.',
        })
      }
    }),
  followsUser: t.procedure
    .input(followUserInput)
    .use(isAuthed)
    .query(async ({ input, ctx }) => {
      try {
        return await prisma.follows.findUnique({
          where: {
            followerId_followingId: {
              followerId: ctx.user.id,
              followingId: input.userId,
            },
          },
        })
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found.',
        })
      }
    }),
})
