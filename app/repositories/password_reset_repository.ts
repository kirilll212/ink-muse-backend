import { DateTime } from 'luxon'
import PasswordResetCode from '#models/password_reset_code'

/**
 * Payload required to persist a new password reset code.
 */
export interface CreateResetCodeData {
  userId: number
  code: string
  expiresAt: DateTime
}

/**
 * The only layer allowed to read/write the `password_reset_codes` table.
 */
export default class PasswordResetRepository {
  /**
   * Persist a new reset code.
   */
  async create(data: CreateResetCodeData): Promise<PasswordResetCode> {
    return PasswordResetCode.create(data)
  }

  /**
   * Return the most recent reset code issued to a user, if any.
   */
  async findLatestForUser(userId: number): Promise<PasswordResetCode | null> {
    return PasswordResetCode.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .first()
  }

  /**
   * Remove every reset code belonging to a user.
   */
  async deleteForUser(userId: number): Promise<void> {
    await PasswordResetCode.query().where('user_id', userId).delete()
  }
}
