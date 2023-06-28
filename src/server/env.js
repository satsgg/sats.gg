// @ts-check
/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const { z } = require('zod')

/*eslint sort-keys: "error"*/
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
  MUX_ACCESS_TOKEN_ID: z.string(),
  MUX_SECRET_KEY: z.string(),
  MUX_SIGNING_KEY_ID: z.string(),
  MUX_SIGNING_KEY_BASE64: z.string(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

const env = envSchema.safeParse(process.env)

if (!env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(env.error.format(), null, 4))
  process.exit(1)
}
module.exports.env = env.data
