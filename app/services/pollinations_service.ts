import { Exception } from '@adonisjs/core/exceptions'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

/**
 * Options accepted when requesting an image from Pollinations.
 */
export interface GenerateImageOptions {
  width: number
  height: number
  seed: number
}

/**
 * Thin HTTP client around the free Pollinations.ai image API.
 *
 * Pollinations works without an API key: an image is produced by issuing a GET
 * request to `https://image.pollinations.ai/prompt/{prompt}`. The public queue
 * can be busy, so requests are retried with a back-off, and an optional free
 * token (`POLLINATIONS_TOKEN`) is sent when configured to raise rate limits.
 */
export default class PollinationsService {
  /**
   * Base endpoint for the image generation API.
   */
  private readonly baseUrl = 'https://image.pollinations.ai/prompt'

  /**
   * Base endpoint for the text generation API.
   */
  private readonly textBaseUrl = 'https://text.pollinations.ai'

  /**
   * AI model used for generation (configurable via `POLLINATIONS_MODEL`).
   */
  private readonly model = env.get('POLLINATIONS_MODEL', 'flux')

  /**
   * Optional free token — raises rate limits when present.
   */
  private readonly token = env.get('POLLINATIONS_TOKEN')

  /**
   * Referrer that identifies this app to Pollinations.
   */
  private readonly referrer = env.get('APP_REFERRER', 'tattoo-sketch-generator')

  /**
   * Abort a single attempt if Pollinations has not answered within this window.
   */
  private readonly timeoutMs = 100_000

  /**
   * How many times to attempt generation before giving up.
   */
  private readonly maxAttempts = 3

  /**
   * Generate an image for the given prompt and return its raw bytes.
   */
  async generateImage(prompt: string, options: GenerateImageOptions): Promise<Buffer> {
    const url = this.buildUrl(prompt, options)
    let lastError: unknown

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await this.requestImage(url)
      } catch (error) {
        lastError = error
        logger.warn({ attempt, err: error }, 'Pollinations attempt failed')

        if (attempt < this.maxAttempts) {
          await this.delay(attempt * 2_000)
        }
      }
    }

    logger.error({ err: lastError }, 'Pollinations generation failed after retries')
    throw new Exception('The image provider is busy, please try again in a moment', {
      status: 502,
      code: 'E_IMAGE_GENERATION_FAILED',
    })
  }

  /**
   * Generate a short piece of text for the given prompt (used to brainstorm
   * tattoo descriptions). Returns the trimmed plain-text response.
   */
  async generateText(prompt: string): Promise<string> {
    let lastError: unknown

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await this.requestText(prompt)
      } catch (error) {
        lastError = error
        logger.warn({ attempt, err: error }, 'Pollinations text attempt failed')

        if (attempt < this.maxAttempts) {
          await this.delay(attempt * 1_000)
        }
      }
    }

    logger.error({ err: lastError }, 'Pollinations text generation failed after retries')
    throw new Exception('The AI text provider is busy, please try again in a moment', {
      status: 502,
      code: 'E_PROMPT_SUGGESTION_FAILED',
    })
  }

  /**
   * Perform a single text request and validate the response.
   */
  private async requestText(prompt: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const query = new URLSearchParams({ referrer: this.referrer })
      const url = `${this.textBaseUrl}/${encodeURIComponent(prompt)}?${query.toString()}`

      const response = await fetch(url, {
        signal: controller.signal,
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
      })

      if (!response.ok) {
        throw new Error(`Unexpected response (status ${response.status})`)
      }

      const text = (await response.text()).trim()

      if (!text) {
        throw new Error('Empty text response')
      }

      return text
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Perform a single image request and validate the response.
   */
  private async requestImage(url: string): Promise<Buffer> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
      })

      const contentType = response.headers.get('content-type') ?? ''

      if (!response.ok || !contentType.startsWith('image/')) {
        throw new Error(`Unexpected response (status ${response.status}, type ${contentType})`)
      }

      return Buffer.from(await response.arrayBuffer())
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Build the fully-encoded Pollinations request URL.
   */
  private buildUrl(prompt: string, options: GenerateImageOptions): string {
    const query = new URLSearchParams({
      model: this.model,
      width: String(options.width),
      height: String(options.height),
      seed: String(options.seed),
      nologo: 'true',
      referrer: this.referrer,
    })

    return `${this.baseUrl}/${encodeURIComponent(prompt)}?${query.toString()}`
  }

  /**
   * Promise-based delay used for retry back-off.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
