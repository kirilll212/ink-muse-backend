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
  BODY_PART_HINTS,
  imageDimensionsForSize,
  STYLE_EXAMPLES,
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
   *
   * Inputs that feed the brainstorm: body part, style + canonical example for
   * that style, and the real-world sketch size.
   */
  async suggestDescription(selection: TattooSelection): Promise<string> {
    const styleName = selection.style.replace(/-/g, ' ')
    const styleExample = STYLE_EXAMPLES[selection.style]

    const instruction = [
      'You are a professional tattoo artist brainstorming a concept for a client.',
      'Base the idea strictly on these parameters and nothing else:',
      `body part = ${selection.bodyPart};`,
      `tattoo style = ${styleName} (${STYLE_PROMPTS[selection.style]});`,
      `a canonical example of this style is ${styleExample} — use it as creative inspiration, not as a subject to copy;`,
      `size = about ${selection.widthCm} by ${selection.heightCm} centimetres.`,
      'The concept must clearly suit that style, fit naturally on that body part,',
      'and work well at that real-world size.',
      'Reply with ONE vivid sentence (15 to 30 words) describing only the subject,',
      'mood and composition of the tattoo.',
      'Do not mention the style name, the body part, measurements, quotes, headings or any preamble.',
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
   *
   * Every selection is woven into the final prompt:
   *   1. body part — placement, orientation, anatomy-specific composition
   *   2. style + canonical example — anchors the visual language
   *   3. sketch size (cm)            — informs density, detail level and aspect ratio
   *   4. description                 — the actual subject the user wants
   *
   * The structure follows Flux-friendly prompt best practices:
   *   • subject leads (diffusion models weight the opening tokens strongest)
   *   • a strong style block (name + craft fragment + iconic example)
   *   • concrete composition + size cues
   *   • quality boosters
   *   • firm exclusions at the end (negative-prompt-style)
   *
   * The output is intentionally a *tattoo design* — flash-sheet artwork on a
   * clean white background — not a photo of a tattooed body.
   */
  private buildPrompt(payload: GenerateTattooPayload): string {
    const styleFragment = STYLE_PROMPTS[payload.style]
    const styleName = payload.style.replace(/-/g, ' ')
    const styleExample = STYLE_EXAMPLES[payload.style]
    const bodyHint = BODY_PART_HINTS[payload.bodyPart]
    const detailLevel = this.detailLevelFor(payload.widthCm, payload.heightCm)

    const orientation =
      payload.widthCm > payload.heightCm * 1.15
        ? 'wide horizontal composition'
        : payload.heightCm > payload.widthCm * 1.15
          ? 'tall vertical composition'
          : 'balanced square composition'

    return [
      // 1. Subject (lead — strongest weight).
      `professional ${styleName} tattoo design of ${payload.description.trim()}`,

      // 2. Style block: name + craft cues + canonical iconic example.
      `authentic ${styleName} tattoo style`,
      styleFragment,
      `drawn with the visual language of canonical ${styleName} tattoos such as ${styleExample}`,

      // 3. Composition + body-part + size.
      `${orientation}, ${bodyHint}, sized for a roughly ${payload.widthCm} by ${payload.heightCm} cm tattoo`,
      detailLevel,

      // 4. Quality boosters.
      'masterpiece, award-winning tattoo flash art, stencil-ready, clean confident linework, crisp sharp edges, bold readable silhouette, deliberate negative space, high contrast, vector-like precision, perfectly centred, sharp focus',

      // 5. Output framing.
      'the tattoo artwork only, isolated on a plain solid pure-white background, studio-clean presentation',

      // 6. Exclusions (negative prompt).
      'no skin, no body, no human, no photo background, no scenery, no mockup, no frame, no border, no shadow, no text, no lettering, no watermark, no signature, no logo, no 3D rendering, no blur',
    ].join(', ')
  }

  /**
   * Map the real-world tattoo size to a detail-level cue. Tiny tattoos can't
   * carry busy detail, so we ask for cleaner simpler artwork; large pieces
   * benefit from intricate detail.
   */
  private detailLevelFor(widthCm: number, heightCm: number): string {
    const longest = Math.max(widthCm, heightCm)
    if (longest <= 5) {
      return 'minimal essential detail suited for a small piece, no busy elements'
    }
    if (longest <= 15) {
      return 'moderate detail suited for a medium piece, clear focal point'
    }
    return 'intricate rich detail suited for a large piece, multiple readable layers'
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
