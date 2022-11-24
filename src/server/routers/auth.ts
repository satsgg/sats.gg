import { t } from '../trpc'
import { encodedUrl, getK1Hash, k1 } from '~/server/service/lnurl'
import { prisma } from '~/server/prisma'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import secp256k1 from 'secp256k1'
import jwt from 'jsonwebtoken'
import { userBalance } from '~/server/service/accounting'
import { sub } from 'date-fns'
import { isAuthed } from '~/server/middlewares/authed'

export const authRouter = t.router({
  getMe: t.procedure.use(isAuthed).query(async ({ ctx }) => {
    const tokenUser = ctx.user
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: tokenUser?.id,
        },
      })
      return { ...user, balance: user ? await userBalance(prisma, user.id) : 0 }
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found.',
      })
    }
  }),
  loginUrl: t.procedure.query(async () => {
    const secret = k1()
    await prisma.userAuth.create({ data: { k1Hash: getK1Hash(secret) } })
    const encoded = encodedUrl(process.env.LN_AUTH_URL ?? 'http://localhost:3000/api/authenticate', 'login', secret)

    return {
      secret: secret,
      encoded: encoded,
    }
  }),
  isLoggedIn: t.procedure
    .input(
      z.object({
        secret: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.secret) {
        return { user: null }
      }

      const k1Hash = getK1Hash(input.secret)
      const user = await prisma.$transaction(async (transactionPrisma) => {
        const userFromAuth = await transactionPrisma.userAuth.findUnique({ where: { k1Hash } })

        if (userFromAuth?.publicKey) {
          return await transactionPrisma.user.findUnique({
            where: { publicKey: userFromAuth?.publicKey },
            select: {
              id: true,
              streamId: true,
              publicKey: true,
              createdAt: true,
              updatedAt: true,
              userName: true,
            },
          })
        }

        return null
      })

      if (!user) {
        return { user: null }
      }

      await prisma.userAuth.deleteMany({
        where: { OR: [{ k1Hash }, { createdAt: { lt: sub(new Date(), { seconds: 90 }) } }] },
      })
      return { user: jwt.sign({ ...user }, process.env.JWT_SECRET ?? '') }
    }),
  authenticate: t.procedure
    .meta({ openapi: { method: 'GET', path: '/authenticate' } })
    .input(
      z.object({
        sig: z.string(),
        k1: z.string(),
        key: z.string().length(66, { message: 'Invalid public key length' }),
      }),
    )
    .output(z.any())
    .query(async ({ input }) => {
      try {
        const sig = Buffer.from(input.sig, 'hex')
        const k1 = Buffer.from(input.k1, 'hex')
        const key = Buffer.from(input.key, 'hex')
        const signature = secp256k1.signatureImport(sig)
        const k1Hash = getK1Hash(input.k1)
        const userAuth = await prisma.userAuth.findFirst({ where: { AND: [{ k1Hash }, { publicKey: null }] } })

        if (!userAuth) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No such secret.' })
        }

        if (secp256k1.ecdsaVerify(signature, k1, key)) {
          await prisma.$transaction(async (transactionPrisma) => {
            let innerUser
            innerUser = await transactionPrisma.user.findUnique({
              where: {
                publicKey: input.key,
              },
            })

            if (!innerUser) {
              const response = await fetch('https://picsum.photos/250')
              const image = await fetch(response.url)
                .then((r) => r.arrayBuffer())
                .then((b) => Buffer.from(b).toString('base64'))

              const muxResponse = await fetch('https://api.mux.com/video/v1/live-streams', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                  Accept: 'application/json;charset=utf-8',
                  Authorization:
                    'Basic ' +
                    Buffer.from(process.env.MUX_ACCESS_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64'),
                },
                body: JSON.stringify({
                  playback_policy: ['public'],
                  new_asset_settings: {
                    playback_policy: ['public'],
                  },
                }),
              })
                .then((r) => r.json())
                .catch((error) => {
                  console.log(error)
                  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
                })

              innerUser = await transactionPrisma.user.create({
                data: {
                  userName: input.key.slice(0, 12),
                  publicKey: input.key,
                  profileImage: `data:image/png;base64,${image}`,
                  streamKey: muxResponse.data.stream_key,
                  playbackId: muxResponse.data.playback_ids[0].id,
                  streamId: muxResponse.data.id,
                },
              })
            }

            await transactionPrisma.userAuth.update({
              where: { k1Hash },
              data: { publicKey: input.key },
            })

            return { status: 'OK' }
          })
        } else {
          console.log('Something went wrong')
          return { status: 'ERROR', reason: 'Something went wrong' }
        }
      } catch (error) {
        console.log(error)
      }

      return new TRPCError({ code: 'BAD_REQUEST', message: 'Something went wrong' })
    }),
})
