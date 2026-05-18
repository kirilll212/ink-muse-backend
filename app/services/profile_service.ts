import { randomUUID } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import { Exception } from '@adonisjs/core/exceptions'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import User from '#models/user'
import UserRepository from '#repositories/user_repository'

/**
 * Validated payload for a profile update.
 */
export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  username: string
  phone?: string | null
}

/**
 * Business logic for editing a user's profile: text fields and the avatar.
 */
@inject()
export default class ProfileService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Absolute path of the directory where avatar images are stored.
   */
  private get avatarsDir(): string {
    return app.makePath('storage/avatars')
  }

  /**
   * Update the user's profile fields, ensuring the username stays unique.
   */
  async updateProfile(user: User, payload: UpdateProfilePayload): Promise<User> {
    const username = payload.username.toLowerCase()

    if (username !== user.username) {
      const taken = await this.userRepository.findByUsername(username)
      if (taken && taken.id !== user.id) {
        throw new Exception('This username is already taken', {
          status: 409,
          code: 'E_USERNAME_TAKEN',
        })
      }
    }

    return this.userRepository.update(user, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      username,
      phone: payload.phone ?? null,
    })
  }

  /**
   * Store an uploaded avatar image and attach it to the user, removing any
   * previous avatar file.
   */
  async setAvatar(user: User, file: MultipartFile): Promise<User> {
    await mkdir(this.avatarsDir, { recursive: true })

    const fileName = `${randomUUID()}.${file.extname || 'jpg'}`
    await file.move(this.avatarsDir, { name: fileName })

    const previous = user.avatarPath
    const updated = await this.userRepository.update(user, { avatarPath: fileName })

    if (previous) {
      await rm(app.makePath('storage/avatars', previous), { force: true })
    }

    return updated
  }
}
