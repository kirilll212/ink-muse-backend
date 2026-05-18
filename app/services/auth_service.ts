import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import User from '#models/user'
import UserRepository from '#repositories/user_repository'

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
  constructor(private userRepository: UserRepository) {}

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
}
