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
import ProfileService from '#services/profile_service';
import { updateProfileValidator } from '#validators/auth_validator';
import { presentUser } from '#presenters/user_presenter';
const AVATAR_NAME_PATTERN = /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;
let ProfileController = class ProfileController {
    profileService;
    constructor(profileService) {
        this.profileService = profileService;
    }
    async update({ request, auth }) {
        const user = auth.getUserOrFail();
        const payload = await request.validateUsing(updateProfileValidator);
        const updated = await this.profileService.updateProfile(user, payload);
        return { user: presentUser(updated) };
    }
    async uploadAvatar({ request, response, auth }) {
        const user = auth.getUserOrFail();
        const avatar = request.file('avatar', {
            size: '5mb',
            extnames: ['jpg', 'jpeg', 'png', 'webp'],
        });
        if (!avatar || !avatar.isValid) {
            return response.unprocessableEntity({
                errors: [{ message: avatar?.errors[0]?.message ?? 'A valid image file is required' }],
            });
        }
        const updated = await this.profileService.setAvatar(user, avatar);
        return { user: presentUser(updated) };
    }
    async serveAvatar({ params, response }) {
        const filename = String(params.filename);
        if (!AVATAR_NAME_PATTERN.test(filename)) {
            return response.notFound({ error: 'Avatar not found' });
        }
        const filePath = app.makePath('storage/avatars', filename);
        if (!existsSync(filePath)) {
            return response.notFound({ error: 'Avatar not found' });
        }
        response.header('Cache-Control', 'public, max-age=31536000, immutable');
        return response.download(filePath);
    }
};
ProfileController = __decorate([
    inject(),
    __metadata("design:paramtypes", [ProfileService])
], ProfileController);
export default ProfileController;
//# sourceMappingURL=profile_controller.js.map