import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AuthService from '#services/auth_service'
import { loginValidator, registerValidator } from '#validators/auth_validator'

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
      user: user.serialize(),
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
      user: user.serialize(),
      token: token.value!.release(),
    }
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
    return { user: auth.getUserOrFail().serialize() }
  }
}
