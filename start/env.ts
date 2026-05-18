/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |--------------------------------------------------------------------------
  | PostgreSQL database
  |--------------------------------------------------------------------------
  |
  | Connection settings for the local PostgreSQL server used by Lucid ORM.
  |
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |--------------------------------------------------------------------------
  | Pollinations.ai image generation
  |--------------------------------------------------------------------------
  |
  | Pollinations works key-less, but the public queue can be busy. Setting a
  | free token (from https://auth.pollinations.ai) raises rate limits and
  | reliability. POLLINATIONS_MODEL picks the image model (flux | turbo).
  |
  */
  POLLINATIONS_TOKEN: Env.schema.string.optional(),
  POLLINATIONS_MODEL: Env.schema.enum.optional(['flux', 'turbo'] as const),
  APP_REFERRER: Env.schema.string.optional(),
})
