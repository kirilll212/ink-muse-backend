import vine from '@vinejs/vine'

/**
 * Validates the payload for `POST /api/auth/register`.
 */
export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(80),
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
