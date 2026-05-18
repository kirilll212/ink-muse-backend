var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { inject } from '@adonisjs/core';
import app from '@adonisjs/core/services/app';
import { existsSync } from 'node:fs';
import TattooService from '#services/tattoo_service';
import { editTattooValidator, generateTattooValidator, suggestPromptValidator, } from '#validators/tattoo_validator';
import { presentTattoo } from '#presenters/tattoo_presenter';
const IMAGE_NAME_PATTERN = /^[0-9a-f-]{36}\.jpg$/i;
let TattoosController = class TattoosController {
    tattooService;
    constructor(tattooService) {
        this.tattooService = tattooService;
    }
    async generate({ request, response, auth }) {
        const user = auth.getUserOrFail();
        const payload = await request.validateUsing(generateTattooValidator);
        const tattoo = await this.tattooService.generate(user, payload);
        return response.created(presentTattoo(tattoo));
    }
    async suggestPrompt({ request }) {
        const selection = await request.validateUsing(suggestPromptValidator);
        const description = await this.tattooService.suggestDescription(selection);
        return { description };
    }
    async edit({ request, response, auth, params }) {
        const user = auth.getUserOrFail();
        const { description } = await request.validateUsing(editTattooValidator);
        const tattoo = await this.tattooService.editForUser(user, params.id, description);
        return response.ok(presentTattoo(tattoo));
    }
    async index({ auth }) {
        const user = auth.getUserOrFail();
        const tattoos = await this.tattooService.listForUser(user);
        return tattoos.map(presentTattoo);
    }
    async show({ auth, params }) {
        const user = auth.getUserOrFail();
        const tattoo = await this.tattooService.findForUser(user, params.id);
        return presentTattoo(tattoo);
    }
    async destroy({ auth, params, response }) {
        const user = auth.getUserOrFail();
        await this.tattooService.deleteForUser(user, params.id);
        return response.noContent();
    }
    async serveImage({ params, response }) {
        const filename = String(params.filename);
        if (!IMAGE_NAME_PATTERN.test(filename)) {
            return response.notFound({ error: 'Image not found' });
        }
        const filePath = app.makePath('storage/tattoos', filename);
        if (!existsSync(filePath)) {
            return response.notFound({ error: 'Image not found' });
        }
        response.header('Cache-Control', 'public, max-age=31536000, immutable');
        return response.download(filePath);
    }
};
TattoosController = __decorate([
    inject(),
    __metadata("design:paramtypes", [TattooService])
], TattoosController);
export default TattoosController;
//# sourceMappingURL=tattoos_controller.js.map