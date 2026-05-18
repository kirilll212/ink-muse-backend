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
import AuthService from '#services/auth_service';
import { loginValidator, registerValidator } from '#validators/auth_validator';
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register({ request, response }) {
        const payload = await request.validateUsing(registerValidator);
        const { user, token } = await this.authService.register(payload);
        return response.created({
            user: user.serialize(),
            token: token.value.release(),
        });
    }
    async login({ request }) {
        const { email, password } = await request.validateUsing(loginValidator);
        const { user, token } = await this.authService.login(email, password);
        return {
            user: user.serialize(),
            token: token.value.release(),
        };
    }
    async logout({ auth, response }) {
        const user = auth.getUserOrFail();
        await this.authService.logout(user, user.currentAccessToken);
        return response.noContent();
    }
    async me({ auth }) {
        return { user: auth.getUserOrFail().serialize() };
    }
};
AuthController = __decorate([
    inject(),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export default AuthController;
//# sourceMappingURL=auth_controller.js.map