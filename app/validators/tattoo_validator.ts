import vine from '@vinejs/vine'
import { BODY_PARTS, SIZE_CM_MAX, SIZE_CM_MIN, STYLES } from '#constants/tattoo_options'

/**
 * Selection fields shared by tattoo generation and AI prompt suggestion.
 *
 * `bodyPart` and `style` are whitelisted against the same constants the tattoo
 * service relies on; `widthCm` / `heightCm` are the real-world dimensions of
 * the tattoo on the body, in centimetres.
 */
const selectionSchema = {
  bodyPart: vine.enum(BODY_PARTS),
  style: vine.enum(STYLES),
  widthCm: vine.number().min(SIZE_CM_MIN).max(SIZE_CM_MAX),
  heightCm: vine.number().min(SIZE_CM_MIN).max(SIZE_CM_MAX),
}

/** The free-text description of the tattoo, 3–500 characters. */
const descriptionRule = vine.string().trim().minLength(3).maxLength(500)

/**
 * Validates the payload for `POST /api/tattoos/generate`.
 */
export const generateTattooValidator = vine.compile(
  vine.object({
    ...selectionSchema,
    description: descriptionRule,
  })
)

/**
 * Validates the payload for `POST /api/tattoos/suggest-prompt`. The user's
 * selections are enough for the AI to brainstorm a description.
 */
export const suggestPromptValidator = vine.compile(vine.object(selectionSchema))

/**
 * Validates the payload for `POST /api/tattoos/:id/edit`. Only a new
 * description is needed — body part, style and size are kept from the
 * original tattoo.
 */
export const editTattooValidator = vine.compile(
  vine.object({
    description: descriptionRule,
  })
)
