import { t } from '../trpc'
import { authRouter } from '~/server/routers/auth'
import { userRouter } from '~/server/routers/user'
import { liveRouter } from '~/server/routers/live'
import { streamRouter } from './stream'
import { invoiceRouter } from './invoice'

export const appRouter = t.router({
  auth: authRouter,
  user: userRouter,
  live: liveRouter,
  stream: streamRouter,
  invoice: invoiceRouter,
})

export type AppRouter = typeof appRouter
