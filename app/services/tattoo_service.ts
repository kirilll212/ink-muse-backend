import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import { Exception } from '@adonisjs/core/exceptions'
import Tattoo from '#models/tattoo'
import User from '#models/user'
import TattooRepository from '#repositories/tattoo_repository'
import PollinationsService from '#services/pollinations_service'
import {
  imageDimensionsForSize,
  STYLE_PROMPTS,
  type BodyPart,
  type Style,
} from '#constants/tattoo_options'

/**
 * The body part / style / physical size the user has selected. Shared by tattoo
 * generation and AI prompt suggestion.
 */
export interface TattooSelection {
  bodyPart: BodyPart
  style: Style
  /** Real-world tattoo width on the body, in centimetres. */
  widthCm: number
  /** Real-world tattoo height on the body, in centimetres. */
  heightCm: number
}

/**
 * Validated payload describing the tattoo a user wants to generate.
 */
export interface GenerateTattooPayload extends TattooSelection {
  description: string
}

/**
 * Orchestrates the full tattoo generation use-case: prompt building, calling
 * the AI provider, persisting the image on disk and storing a DB record.
 *
 * This service holds the business logic only — it never touches Lucid models
 * directly (that is the repository's job) and never parses HTTP input (that is
 * the controller's job).
 */
@inject()
export default class TattooService {
  constructor(
    private tattooRepository: TattooRepository,
    private pollinationsService: PollinationsService
  ) {}

  /**
   * Absolute path of the directory where generated images are stored.
   */
  private get storageDir(): string {
    return app.makePath('storage/tattoos')
  }

  /**
   * Generate a tattoo sketch for the given user and persist it.
   */
  async generate(user: User, payload: GenerateTattooPayload): Promise<Tattoo> {
    const { width, height } = imageDimensionsForSize(payload.widthCm, payload.heightCm)
    const seed = this.randomSeed()
    const finalPrompt = this.buildPrompt(payload)

    const imageBytes = await this.pollinationsService.generateImage(finalPrompt, {
      width,
      height,
      seed,
    })

    const imagePath = await this.storeImage(imageBytes)

    return this.tattooRepository.create({
      userId: user.id,
      bodyPart: payload.bodyPart,
      style: payload.style,
      widthCm: payload.widthCm,
      heightCm: payload.heightCm,
      description: payload.description,
      finalPrompt,
      imagePath,
      seed,
      width,
      height,
    })
  }

  /**
   * Re-generate an existing tattoo from an edited description, keeping its
   * body part, style and size. The new image replaces the old one on disk and
   * the same record is updated in place.
   */
  async editForUser(user: User, id: number, description: string): Promise<Tattoo> {
    const tattoo = await this.findForUser(user, id)

    const payload: GenerateTattooPayload = {
      bodyPart: tattoo.bodyPart as BodyPart,
      style: tattoo.style as Style,
      widthCm: tattoo.widthCm,
      heightCm: tattoo.heightCm,
      description,
    }

    const { width, height } = imageDimensionsForSize(tattoo.widthCm, tattoo.heightCm)
    const seed = this.randomSeed()
    const finalPrompt = this.buildPrompt(payload)

    const imageBytes = await this.pollinationsService.generateImage(finalPrompt, {
      width,
      height,
      seed,
    })

    const previousImagePath = tattoo.imagePath
    const imagePath = await this.storeImage(imageBytes)

    const updated = await this.tattooRepository.update(tattoo, {
      description,
      finalPrompt,
      imagePath,
      seed,
      width,
      height,
    })

    // Drop the superseded image file only after the update succeeds.
    await rm(app.makePath('storage/tattoos', previousImagePath), { force: true })

    return updated
  }

  /**
   * Ask the AI to brainstorm a tattoo description from the user's selections.
   * The result is meant to pre-fill the description field on the generator.
   */
  async suggestDescription(selection: TattooSelection): Promise<string> {
    const instruction = [
      'You are a professional tattoo artist brainstorming ideas for a client.',
      `Propose ONE creative tattoo design concept intended for the ${selection.bodyPart}.`,
      `Artistic style: ${STYLE_PROMPTS[selection.style]}.`,
      `The tattoo measures roughly ${selection.widthCm} by ${selection.heightCm} centimetres,`,
      'so keep the composition appropriate for that real-world size.',
      'Reply with a single vivid sentence (15 to 35 words) describing only the subject,',
      'mood and composition of the tattoo.',
      'Do not include quotes, headings, style names, body-part names, measurements or any preamble.',
    ].join(' ')

    const raw = await this.pollinationsService.generateText(instruction)
    return this.sanitizeSuggestion(raw)
  }

  /**
   * Return every tattoo owned by the user, newest first.
   */
  async listForUser(user: User): Promise<Tattoo[]> {
    return this.tattooRepository.listByUser(user.id)
  }

  /**
   * Return a single tattoo owned by the user or throw a 404.
   */
  async findForUser(user: User, id: number): Promise<Tattoo> {
    const tattoo = await this.tattooRepository.findForUser(id, user.id)

    if (!tattoo) {
      throw new Exception('Tattoo not found', { status: 404, code: 'E_TATTOO_NOT_FOUND' })
    }

    return tattoo
  }

  /**
   * Delete a tattoo owned by the user, including its image file.
   */
  async deleteForUser(user: User, id: number): Promise<void> {
    const tattoo = await this.findForUser(user, id)
    await this.tattooRepository.delete(tattoo)
    await rm(app.makePath('storage/tattoos', tattoo.imagePath), { force: true })
  }

  /**
   * Compose the prompt sent to the AI model from the user's selections.
   */
  private buildPrompt(payload: GenerateTattooPayload): string {
    const styleFragment = STYLE_PROMPTS[payload.style]

    return [
      'tattoo design',
      styleFragment,
      payload.description.trim(),
      `intended for placement on the ${payload.bodyPart}`,
      `sized for a ${payload.widthCm} by ${payload.heightCm} cm area of skin`,
      'isolated on a clean white background',
      'high detail, crisp ink, sketch',
    ].join(', ')
  }

  /**
   * Clean up an AI-generated suggestion so it is safe to pre-fill the form:
   * strip wrapping quotes / whitespace, collapse line breaks and clamp length.
   */
  private sanitizeSuggestion(text: string): string {
    const cleaned = text
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^["'`\s]+|["'`\s]+$/g, '')
      .trim()

    if (cleaned.length < 3) {
      throw new Exception('Could not generate a prompt, please try again', {
        status: 502,
        code: 'E_PROMPT_SUGGESTION_FAILED',
      })
    }

    return cleaned.slice(0, 500)
  }

  /**
   * Write the image bytes to disk and return the generated file name.
   */
  private async storeImage(bytes: Buffer): Promise<string> {
    await mkdir(this.storageDir, { recursive: true })
    const fileName = `${randomUUID()}.jpg`
    await writeFile(app.makePath('storage/tattoos', fileName), bytes)
    return fileName
  }

  /**
   * Produce a random positive 32-bit seed for reproducible generations.
   */
  private randomSeed(): number {
    return Math.floor(Math.random() * 2_147_483_647)
  }
}
