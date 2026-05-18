import vine from '@vinejs/vine';
import { BODY_PARTS, SIZE_CM_MAX, SIZE_CM_MIN, STYLES } from '#constants/tattoo_options';
const selectionSchema = {
    bodyPart: vine.enum(BODY_PARTS),
    style: vine.enum(STYLES),
    widthCm: vine.number().min(SIZE_CM_MIN).max(SIZE_CM_MAX),
    heightCm: vine.number().min(SIZE_CM_MIN).max(SIZE_CM_MAX),
};
const descriptionRule = vine.string().trim().minLength(3).maxLength(500);
export const generateTattooValidator = vine.compile(vine.object({
    ...selectionSchema,
    description: descriptionRule,
}));
export const suggestPromptValidator = vine.compile(vine.object(selectionSchema));
export const editTattooValidator = vine.compile(vine.object({
    description: descriptionRule,
}));
//# sourceMappingURL=tattoo_validator.js.map