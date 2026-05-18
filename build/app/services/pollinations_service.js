import { Exception } from '@adonisjs/core/exceptions';
import logger from '@adonisjs/core/services/logger';
import env from '#start/env';
export default class PollinationsService {
    baseUrl = 'https://image.pollinations.ai/prompt';
    textBaseUrl = 'https://text.pollinations.ai';
    model = env.get('POLLINATIONS_MODEL', 'flux');
    token = env.get('POLLINATIONS_TOKEN');
    referrer = env.get('APP_REFERRER', 'tattoo-sketch-generator');
    timeoutMs = 100_000;
    maxAttempts = 3;
    async generateImage(prompt, options) {
        const url = this.buildUrl(prompt, options);
        let lastError;
        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                return await this.requestImage(url);
            }
            catch (error) {
                lastError = error;
                logger.warn({ attempt, err: error }, 'Pollinations attempt failed');
                if (attempt < this.maxAttempts) {
                    await this.delay(attempt * 2_000);
                }
            }
        }
        logger.error({ err: lastError }, 'Pollinations generation failed after retries');
        throw new Exception('The image provider is busy, please try again in a moment', {
            status: 502,
            code: 'E_IMAGE_GENERATION_FAILED',
        });
    }
    async generateText(prompt) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                return await this.requestText(prompt);
            }
            catch (error) {
                lastError = error;
                logger.warn({ attempt, err: error }, 'Pollinations text attempt failed');
                if (attempt < this.maxAttempts) {
                    await this.delay(attempt * 1_000);
                }
            }
        }
        logger.error({ err: lastError }, 'Pollinations text generation failed after retries');
        throw new Exception('The AI text provider is busy, please try again in a moment', {
            status: 502,
            code: 'E_PROMPT_SUGGESTION_FAILED',
        });
    }
    async requestText(prompt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const query = new URLSearchParams({ referrer: this.referrer });
            const url = `${this.textBaseUrl}/${encodeURIComponent(prompt)}?${query.toString()}`;
            const response = await fetch(url, {
                signal: controller.signal,
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
            });
            if (!response.ok) {
                throw new Error(`Unexpected response (status ${response.status})`);
            }
            const text = (await response.text()).trim();
            if (!text) {
                throw new Error('Empty text response');
            }
            return text;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async requestImage(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
            });
            const contentType = response.headers.get('content-type') ?? '';
            if (!response.ok || !contentType.startsWith('image/')) {
                throw new Error(`Unexpected response (status ${response.status}, type ${contentType})`);
            }
            return Buffer.from(await response.arrayBuffer());
        }
        finally {
            clearTimeout(timeout);
        }
    }
    buildUrl(prompt, options) {
        const query = new URLSearchParams({
            model: this.model,
            width: String(options.width),
            height: String(options.height),
            seed: String(options.seed),
            nologo: 'true',
            referrer: this.referrer,
        });
        return `${this.baseUrl}/${encodeURIComponent(prompt)}?${query.toString()}`;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=pollinations_service.js.map