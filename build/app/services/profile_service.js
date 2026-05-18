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
import { mkdir, rm } from 'node:fs/promises';
import { inject } from '@adonisjs/core';
import app from '@adonisjs/core/services/app';
import { Exception } from '@adonisjs/core/exceptions';
import UserRepository from '#repositories/user_repository';
let ProfileService = class ProfileService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    get avatarsDir() {
        return app.makePath('storage/avatars');
    }
    async updateProfile(user, payload) {
        const username = payload.username.toLowerCase();
        if (username !== user.username) {
            const taken = await this.userRepository.findByUsername(username);
            if (taken && taken.id !== user.id) {
                throw new Exception('This username is already taken', {
                    status: 409,
                    code: 'E_USERNAME_TAKEN',
                });
            }
        }
        return this.userRepository.update(user, {
            firstName: payload.firstName,
            lastName: payload.lastName,
            username,
            phone: payload.phone ?? null,
        });
    }
    async setAvatar(user, file) {
        await mkdir(this.avatarsDir, { recursive: true });
        const fileName = `${randomUUID()}.${file.extname || 'jpg'}`;
        await file.move(this.avatarsDir, { name: fileName });
        const previous = user.avatarPath;
        const updated = await this.userRepository.update(user, { avatarPath: fileName });
        if (previous) {
            await rm(app.makePath('storage/avatars', previous), { force: true });
        }
        return updated;
    }
};
ProfileService = __decorate([
    inject(),
    __metadata("design:paramtypes", [UserRepository])
], ProfileService);
export default ProfileService;
//# sourceMappingURL=profile_service.js.map