import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import { existsSync } from 'node:fs'
import TattooService from '#services/tattoo_service'
import {
  editTattooValidator,
  generateTattooValidator,
  suggestPromptValidator,
} from '#validators/tattoo_validator'
import { presentTattoo } from '#presenters/tattoo_presenter'

/**
 * Matches the UUID-based file names produced by the tattoo service. Used to
 * reject any path-traversal attempt on the public image endpoint.
 */
const IMAGE_NAME_PATTERN = /^[0-9a-f-]{36}\.jpg$/i

/**
 * Handles tattoo generation, history listing and image streaming.
 *
 * All persistence and AI logic lives in {@link TattooService}; the controller
 * only parses requests and shapes responses.
 */
@inject()
export default class TattoosController {
  constructor(private tattooService: TattooService) {}

  /**
   * POST /api/tattoos/generate
   */
  async generate({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(generateTattooValidator)
    const tattoo = await this.tattooService.generate(user, payload)

    return response.created(presentTattoo(tattoo))
  }

  /**
   * POST /api/tattoos/suggest-prompt — ask the AI for a description idea
   * based on the selected body part, style and size.
   */
  async suggestPrompt({ request }: HttpContext) {
    const selection = await request.validateUsing(suggestPromptValidator)
    const description = await this.tattooService.suggestDescription(selection)

    return { description }
  }

  /**
   * POST /api/tattoos/:id/edit — re-generate a tattoo from an edited
   * description, keeping its body part, style and size.
   */
  async edit({ request, response, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const { description } = await request.validateUsing(editTattooValidator)
    const tattoo = await this.tattooService.editForUser(user, params.id, description)

    return response.ok(presentTattoo(tattoo))
  }

  /**
   * GET /api/tattoos — current user's generation history.
   */
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const tattoos = await this.tattooService.listForUser(user)

    return tattoos.map(presentTattoo)
  }

  /**
   * GET /api/tattoos/:id
   */
  async show({ auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const tattoo = await this.tattooService.findForUser(user, params.id)

    return presentTattoo(tattoo)
  }

  /**
   * DELETE /api/tattoos/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await this.tattooService.deleteForUser(user, params.id)

    return response.noContent()
  }

  /**
   * GET /api/tattoos/images/:filename — streams a generated image file.
   *
   * Public on purpose so `<img>` tags can load it without auth headers; the
   * UUID file names are unguessable.
   */
  async serveImage({ params, response }: HttpContext) {
    const filename = String(params.filename)

    if (!IMAGE_NAME_PATTERN.test(filename)) {
      return response.notFound({ error: 'Image not found' })
    }

    const filePath = app.makePath('storage/tattoos', filename)

    if (!existsSync(filePath)) {
      return response.notFound({ error: 'Image not found' })
    }

    response.header('Cache-Control', 'public, max-age=31536000, immutable')
    return response.download(filePath)
  }
}
