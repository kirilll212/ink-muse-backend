import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import hash from '@adonisjs/core/services/hash'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import User from '#models/user'
import UserRepository from '#repositories/user_repository'
import PasswordResetRepository from '#repositories/password_reset_repository'

/**
 * Fields required to register a new account.
 */
export interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

/**
 * Result of a successful authentication: the user and a fresh access token.
 */
export interface AuthResult {
  user: User
  token: AccessToken
}

/**
 * Holds the authentication business logic (registration + login). HTTP parsing
 * lives in the controller, DB access lives in the repository.
 */
@inject()
export default class AuthService {
  constructor(
    private userRepository: UserRepository,
    private passwordResetRepository: PasswordResetRepository
  ) {}

  /**
   * Register a new user and issue an access token for an immediate session.
   */
  async register(payload: RegisterPayload): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(payload.email)

    if (existing) {
      throw new Exception('An account with this email already exists', {
        status: 409,
        code: 'E_EMAIL_TAKEN',
      })
    }

    const user = await this.userRepository.create(payload)
    const token = await User.accessTokens.create(user)

    return { user, token }
  }

  /**
   * Verify credentials and issue an access token.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return { user, token }
  }

  /**
   * Revoke the access token used for the current request.
   */
  async logout(user: User, token: AccessToken): Promise<void> {
    await User.accessTokens.delete(user, token.identifier)
  }

  /**
   * Issue a password reset code for the account with the given email.
   *
   * This project has no email delivery, so the plain 6-digit code is returned
   * to the caller and surfaced by the API for the user to complete the reset.
   */
  async requestPasswordReset(email: string): Promise<{ code: string; expiresInMinutes: number }> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new Exception('No account found with this email address', {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }

    const code = this.generateResetCode()
    const expiresInMinutes = 15

    // Replace any earlier codes so only the newest one is ever valid.
    await this.passwordResetRepository.deleteForUser(user.id)
    await this.passwordResetRepository.create({
      userId: user.id,
      code: await hash.make(code),
      expiresAt: DateTime.now().plus({ minutes: expiresInMinutes }),
    })

    return { code, expiresInMinutes }
  }

  /**
   * Verify a reset code and set a new password for the account.
   */
  async resetPassword(email: string, code: string, password: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new Exception('No account found with this email address', {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }

    const record = await this.passwordResetRepository.findLatestForUser(user.id)
    const isValid =
      record !== null &&
      record.expiresAt > DateTime.now() &&
      (await hash.verify(record.code, code))

    if (!isValid) {
      throw new Exception('This reset code is invalid or has expired', {
        status: 422,
        code: 'E_INVALID_RESET_CODE',
      })
    }

    await this.userRepository.updatePassword(user, password)
    await this.passwordResetRepository.deleteForUser(user.id)
  }

  /**
   * Produce a random 6-digit reset code.
   */
  private generateResetCode(): string {
    return String(Math.floor(100_000 + Math.random() * 900_000))
  }
}
