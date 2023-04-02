import { t } from '../trpc'
import { authRouter } from '~/server/routers/auth'
import { userRouter } from '~/server/routers/user'

export const appRouter = t.router({
  auth: authRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
