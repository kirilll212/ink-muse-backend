import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AuthService from '#services/auth_service'
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
} from '#validators/auth_validator'
import { presentUser } from '#presenters/user_presenter'

/**
 * Handles registration, login, logout and the current-user endpoint.
 *
 * The controller only parses requests and shapes responses — all business
 * logic lives in {@link AuthService}.
 */
@inject()
export default class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/register
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const { user, token } = await this.authService.register(payload)

    return response.created({
      user: presentUser(user),
      token: token.value!.release(),
    })
  }

  /**
   * POST /api/auth/login
   */
  async login({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const { user, token } = await this.authService.login(email, password)

    return {
      user: presentUser(user),
      token: token.value!.release(),
    }
  }

  /**
   * POST /api/auth/forgot-password — issue a password reset code.
   *
   * With no email delivery configured, the code is returned in the response.
   */
  async forgotPassword({ request }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const { code, expiresInMinutes } = await this.authService.requestPasswordReset(email)

    return { email, code, expiresInMinutes }
  }

  /**
   * POST /api/auth/reset-password — set a new password using a reset code.
   */
  async resetPassword({ request, response }: HttpContext) {
    const { email, code, password } = await request.validateUsing(resetPasswordValidator)
    await this.authService.resetPassword(email, code, password)

    return response.ok({ success: true })
  }

  /**
   * POST /api/auth/logout
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await this.authService.logout(user, user.currentAccessToken)

    return response.noContent()
  }

  /**
   * GET /api/auth/me
   */
  async me({ auth }: HttpContext) {
    return { user: presentUser(auth.getUserOrFail()) }
  }
}
