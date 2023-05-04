import { t } from '../trpc'
import { prisma } from '~/server/prisma'
import { TRPCError } from '@trpc/server'
import { StreamStatus } from '@prisma/client'

export const liveRouter = t.router({
  getLiveStreams: t.procedure.query(async () => {
    return await prisma.user
      .findMany({
        where: {
          streamStatus: StreamStatus.ACTIVE,
        },
        select: {
          publicKey: true,
          playbackId: true,
        },
      })
      .catch((error) => {
        console.log(error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      })
  }),
})
