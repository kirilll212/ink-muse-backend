import vine from '@vinejs/vine';
const usernameRule = vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(30)
    .regex(/^[a-zA-Z0-9_]+$/);
const phoneRule = vine
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,15}$/);
export const registerValidator = vine.compile(vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(60),
    lastName: vine.string().trim().minLength(1).maxLength(60),
    username: usernameRule,
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(120),
}));
export const loginValidator = vine.compile(vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
}));
export const updateProfileValidator = vine.compile(vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(60),
    lastName: vine.string().trim().minLength(1).maxLength(60),
    username: usernameRule,
    phone: phoneRule.nullable().optional(),
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