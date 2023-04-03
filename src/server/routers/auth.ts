import { t } from '../trpc'
import { prisma } from '~/server/prisma'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import jwt from 'jsonwebtoken'
import { sub } from 'date-fns'
import { isAuthed } from '~/server/middlewares/authed'
import { createHash, randomBytes } from 'crypto'
import { validateEvent, verifySignature, Event as NostrEvent } from 'nostr-tools'

export const authRouter = t.router({
  getMe: t.procedure.use(isAuthed).query(async ({ ctx }) => {
    const tokenUser = ctx.user
    try {
      return await prisma.user.findUnique({
        where: {
          id: tokenUser?.id,
        },
      })
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found.',
      })
    }
  }),
  getChallenge: t.procedure.query(async () => {
    const secret = randomBytes(32).toString('hex')
    await prisma.userAuth.create({ data: { challengeHash: createHash('sha256').update(secret).digest('hex') } })
    return {
      challenge: secret,
    }
  }),
  login: t.procedure
    .input(
      z.object({
        id: z.string(),
        pubkey: z.string(),
        created_at: z.number(),
        kind: z.number(),
        tags: z.array(z.array(z.string())),
        content: z.preprocess((val: any) => JSON.parse(val), z.object({ challenge: z.string(), message: z.string() })),
        sig: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO: Update to newest nostr-tools and use SignedEvent type
      const signedAuthEvent: NostrEvent & { sig: string } = { ...input, content: JSON.stringify(input.content) }
      console.debug('input', input)
      try {
        let ok = validateEvent(signedAuthEvent)
        if (!ok) throw new Error('Invalid event')

        let veryOk = verifySignature(signedAuthEvent)
        if (!veryOk) throw new Error('Invalid signature')
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err.message })
      }

      // signature and event okay... now check challenge
      const challengeHash = createHash('sha256').update(input.content.challenge).digest('hex')

      // TODO: Also store pubkey associated with the challengeHash?
      const userAuth = await prisma.userAuth.findFirst({ where: { challengeHash } })
      if (!userAuth) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No such secret.' })
      }

      const user = await prisma.$transaction(async (transactionPrisma) => {
        let innerUser
        innerUser = await transactionPrisma.user.findUnique({
          where: {
            publicKey: input.pubkey,
          },
        })

        if (!innerUser) {
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
              publicKey: input.pubkey,
              streamKey: muxResponse.data.stream_key,
              playbackId: muxResponse.data.playback_ids[0].id,
              streamId: muxResponse.data.id,
            },
          })
        }

        return innerUser
      })

      // user logged in. Delete the challengeHash that was used and any challenges older than 90 seconds
      await prisma.userAuth.deleteMany({
        where: { OR: [{ challengeHash }, { createdAt: { lt: sub(new Date(), { seconds: 90 }) } }] },
      })

      return { authToken: jwt.sign({ ...user }, process.env.JWT_SECRET ?? '') }
    }),
})
