var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { inject } from '@adonisjs/core';
import app from '@adonisjs/core/services/app';
import { Exception } from '@adonisjs/core/exceptions';
import TattooRepository from '#repositories/tattoo_repository';
import PollinationsService from '#services/pollinations_service';
import { imageDimensionsForSize, STYLE_EXAMPLES, STYLE_PROMPTS, } from '#constants/tattoo_options';
let TattooService = class TattooService {
    tattooRepository;
    pollinationsService;
    constructor(tattooRepository, pollinationsService) {
        this.tattooRepository = tattooRepository;
        this.pollinationsService = pollinationsService;
    }
    get storageDir() {
        return app.makePath('storage/tattoos');
    }
    async generate(user, payload) {
        const { width, height } = imageDimensionsForSize(payload.widthCm, payload.heightCm);
        const seed = this.randomSeed();
        const finalPrompt = this.buildPrompt(payload);
        const imageBytes = await this.pollinationsService.generateImage(finalPrompt, {
            width,
            height,
            seed,
        });
        const imagePath = await this.storeImage(imageBytes);
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
        });
    }
    async editForUser(user, id, description) {
        const tattoo = await this.findForUser(user, id);
        const payload = {
            bodyPart: tattoo.bodyPart,
            style: tattoo.style,
            widthCm: tattoo.widthCm,
            heightCm: tattoo.heightCm,
            description,
        };
        const { width, height } = imageDimensionsForSize(tattoo.widthCm, tattoo.heightCm);
        const seed = this.randomSeed();
        const finalPrompt = this.buildPrompt(payload);
        const imageBytes = await this.pollinationsService.generateImage(finalPrompt, {
            width,
            height,
            seed,
        });
        const previousImagePath = tattoo.imagePath;
        const imagePath = await this.storeImage(imageBytes);
        const updated = await this.tattooRepository.update(tattoo, {
            description,
            finalPrompt,
            imagePath,
            seed,
            width,
            height,
        });
        await rm(app.makePath('storage/tattoos', previousImagePath), { force: true });
        return updated;
    }
    async suggestDescription(selection) {
        const styleName = selection.style.replace(/-/g, ' ');
        const styleExample = STYLE_EXAMPLES[selection.style];
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
        ].join(' ');
        const raw = await this.pollinationsService.generateText(instruction);
        return this.sanitizeSuggestion(raw);
    }
    async listForUser(user) {
        return this.tattooRepository.listByUser(user.id);
    }
    async findForUser(user, id) {
        const tattoo = await this.tattooRepository.findForUser(id, user.id);
        if (!tattoo) {
            throw new Exception('Tattoo not found', { status: 404, code: 'E_TATTOO_NOT_FOUND' });
        }
        return tattoo;
    }
    async deleteForUser(user, id) {
        const tattoo = await this.findForUser(user, id);
        await this.tattooRepository.delete(tattoo);
        await rm(app.makePath('storage/tattoos', tattoo.imagePath), { force: true });
    }
    buildPrompt(payload) {
        const styleFragment = STYLE_PROMPTS[payload.style];
        const styleName = payload.style.replace(/-/g, ' ');
        const styleExample = STYLE_EXAMPLES[payload.style];
        const orientation = payload.widthCm > payload.heightCm * 1.15
            ? 'wide horizontal composition'
            : payload.heightCm > payload.widthCm * 1.15
                ? 'tall vertical composition'
                : 'balanced centered composition';
        return [
            `tattoo design of ${payload.description.trim()}`,
            `${styleName} tattoo style`,
            styleFragment,
            `rendered with the same visual language as a canonical ${styleName} example such as ${styleExample}`,
            'professional tattoo flash art, stencil-ready, clean confident linework, crisp sharp edges, bold readable silhouette, deliberate negative space',
            `${orientation}, a single cohesive subject sized and shaped for a ${payload.bodyPart} tattoo of roughly ${payload.widthCm} by ${payload.heightCm} cm`,
            'high detail, high contrast, vector-like precision, perfectly centered',
            'the tattoo artwork only, isolated on a plain solid white background',
            'no skin, no body, no human, no photo background, no mockup, no frame, no border, no text, no lettering, no watermark, no signature',
        ].join(', ');
    }
    sanitizeSuggestion(text) {
        const cleaned = text
            .replace(/[\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^["'`\s]+|["'`\s]+$/g, '')
            .trim();
        if (cleaned.length < 3) {
            throw new Exception('Could not generate a prompt, please try again', {
                status: 502,
                code: 'E_PROMPT_SUGGESTION_FAILED',
            });
        }
        return cleaned.slice(0, 500);
    }
    async storeImage(bytes) {
        await mkdir(this.storageDir, { recursive: true });
        const fileName = `${randomUUID()}.jpg`;
        await writeFile(app.makePath('storage/tattoos', fileName), bytes);
        return fileName;
    }
    randomSeed() {
        return Math.floor(Math.random() * 2_147_483_647);
    }
};
TattooService = __decorate([
    inject(),
    __metadata("design:paramtypes", [TattooRepository,
        PollinationsService])
], TattooService);
export default TattooService;
//# sourceMappingURL=tattoo_service.js.map