import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import { existsSync } from 'node:fs'
import ProfileService from '#services/profile_service'
import { updateProfileValidator } from '#validators/auth_validator'
import { presentUser } from '#presenters/user_presenter'

/**
 * Matches the UUID-based avatar file names produced by the profile service.
 * Used to reject any path-traversal attempt on the public avatar endpoint.
 */
const AVATAR_NAME_PATTERN = /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i

/**
 * Handles profile editing: text fields, avatar upload and avatar streaming.
 */
@inject()
export default class ProfileController {
  constructor(private profileService: ProfileService) {}

  /**
   * PATCH /api/profile — update the current user's profile fields.
   */
  async update({ request, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProfileValidator)
    const updated = await this.profileService.updateProfile(user, payload)

    return { user: presentUser(updated) }
  }

  /**
   * POST /api/profile/avatar — upload a new avatar image.
   */
  async uploadAvatar({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const avatar = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!avatar || !avatar.isValid) {
      return response.unprocessableEntity({
        errors: [{ message: avatar?.errors[0]?.message ?? 'A valid image file is required' }],
      })
    }

    const updated = await this.profileService.setAvatar(user, avatar)
    return { user: presentUser(updated) }
  }

  /**
   * GET /api/users/avatars/:filename — streams an avatar image.
   *
   * Public on purpose so `<img>` tags can load it without auth headers; the
   * UUID file names are unguessable.
   */
  async serveAvatar({ params, response }: HttpContext) {
    const filename = String(params.filename)

    if (!AVATAR_NAME_PATTERN.test(filename)) {
      return response.notFound({ error: 'Avatar not found' })
    }

    const filePath = app.makePath('storage/avatars', filename)

    if (!existsSync(filePath)) {
      return response.notFound({ error: 'Avatar not found' })
    }

    response.header('Cache-Control', 'public, max-age=31536000, immutable')
    return response.download(filePath)
  }
}
