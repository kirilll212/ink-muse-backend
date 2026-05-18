import vine from '@vinejs/vine'

/** A username: 3–30 chars, letters / digits / underscores only. */
const usernameRule = vine
  .string()
  .trim()
  .minLength(3)
  .maxLength(30)
  .regex(/^[a-zA-Z0-9_]+$/)

/** A phone number in E.164 format (e.g. +380501234567). */
const phoneRule = vine
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,15}$/)

/**
 * Validates the payload for `POST /api/auth/register`.
 */
export const registerValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(60),
    lastName: vine.string().trim().minLength(1).maxLength(60),
    username: usernameRule,
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(120),
  })
)

/**
 * Validates the payload for `POST /api/auth/login`.
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
  })
)

/**
 * Validates the payload for `PATCH /api/profile`.
 */
export const updateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(60),
    lastName: vine.string().trim().minLength(1).maxLength(60),
    username: usernameRule,
    phone: phoneRule.nullable().optional(),
  })
)

/**
 * Validates the payload for `POST /api/auth/forgot-password`.
 */
export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
  })
)

/**
 * Validates the payload for `POST /api/auth/reset-password`.
 */
export const resetPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    code: vine.string().trim().regex(/^\d{6}$/),
    password: vine.string().minLength(8).maxLength(120),
  })
)
