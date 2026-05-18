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
//# sourceMappingURL=auth_validator.js.map