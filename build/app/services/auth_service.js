var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DateTime } from 'luxon';
import { inject } from '@adonisjs/core';
import { Exception } from '@adonisjs/core/exceptions';
import hash from '@adonisjs/core/services/hash';
import User from '#models/user';
import UserRepository from '#repositories/user_repository';
import PasswordResetRepository from '#repositories/password_reset_repository';
let AuthService = class AuthService {
    userRepository;
    passwordResetRepository;
    constructor(userRepository, passwordResetRepository) {
        this.userRepository = userRepository;
        this.passwordResetRepository = passwordResetRepository;
    }
    async register(payload) {
        const username = payload.username.toLowerCase();
        if (await this.userRepository.findByEmail(payload.email)) {
            throw new Exception('An account with this email already exists', {
                status: 409,
                code: 'E_EMAIL_TAKEN',
            });
        }
        if (await this.userRepository.findByUsername(username)) {
            throw new Exception('This username is already taken', {
                status: 409,
                code: 'E_USERNAME_TAKEN',
            });
        }
        const user = await this.userRepository.create({ ...payload, username });
        const token = await User.accessTokens.create(user);
        return { user, token };
    }
    async login(email, password) {
        const user = await User.verifyCredentials(email, password);
        const token = await User.accessTokens.create(user);
        return { user, token };
    }
    async logout(user, token) {
        await User.accessTokens.delete(user, token.identifier);
    }
    async requestPasswordReset(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Exception('No account found with this email address', {
                status: 404,
                code: 'E_USER_NOT_FOUND',
            });
        }
        const code = this.generateResetCode();
        const expiresInMinutes = 15;
        await this.passwordResetRepository.deleteForUser(user.id);
        await this.passwordResetRepository.create({
            userId: user.id,
            code: await hash.make(code),
            expiresAt: DateTime.now().plus({ minutes: expiresInMinutes }),
        });
        return { code, expiresInMinutes };
    }
    async resetPassword(email, code, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Exception('No account found with this email address', {
                status: 404,
                code: 'E_USER_NOT_FOUND',
            });
        }
        const record = await this.passwordResetRepository.findLatestForUser(user.id);
        const isValid = record !== null &&
            record.expiresAt > DateTime.now() &&
            (await hash.verify(record.code, code));
        if (!isValid) {
            throw new Exception('This reset code is invalid or has expired', {
                status: 422,
                code: 'E_INVALID_RESET_CODE',
            });
        }
        await this.userRepository.updatePassword(user, password);
        await this.passwordResetRepository.deleteForUser(user.id);
    }
    generateResetCode() {
        return String(Math.floor(100_000 + Math.random() * 900_000));
    }
};
AuthService = __decorate([
    inject(),
    __metadata("design:paramtypes", [UserRepository,
        PasswordResetRepository])
], AuthService);
export default AuthService;
//# sourceMappingURL=auth_service.js.map