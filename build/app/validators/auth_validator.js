import vine from '@vinejs/vine';
export const registerValidator = vine.compile(vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(80),
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(120),
}));
export const loginValidator = vine.compile(vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
}));
export const forgotPasswordValidator = vine.compile(vine.object({
    email: vine.string().trim().email().normalizeEmail(),
}));
export const resetPasswordValidator = vine.compile(vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    code: vine.string().trim().regex(/^\d{6}$/),
    password: vine.string().minLength(8).maxLength(120),
}));
//# sourceMappingURL=auth_validator.js.map