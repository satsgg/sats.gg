import { t } from '../trpc'
import { authRouter } from '~/server/routers/auth'
import { userRouter } from '~/server/routers/user'
import { liveRouter } from '~/server/routers/live'

export const appRouter = t.router({
  auth: authRouter,
  user: userRouter,
  live: liveRouter,
})

export type AppRouter = typeof appRouter
