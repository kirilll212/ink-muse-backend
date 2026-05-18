/*
|--------------------------------------------------------------------------
| Tattoo generation options
|--------------------------------------------------------------------------
|
| Single source of truth for the body parts, styles and sizes accepted by the
| API. Validators use the keys to whitelist incoming requests and the tattoo
| service uses the prompt fragments / dimensions when talking to the AI model.
|
*/

export const BODY_PARTS = [
  'arm',
  'forearm',
  'shoulder',
  'chest',
  'back',
  'leg',
  'calf',
  'ankle',
  'wrist',
  'hand',
  'neck',
  'ribs',
] as const

export const STYLES = [
  'line-art',
  'minimalist',
  'geometric',
  'traditional',
  'neo-traditional',
  'realistic',
  'blackwork',
  'dotwork',
  'tribal',
  'watercolor',
  'japanese',
  'new-school',
  'sketch',
  'ornamental',
  'surrealism',
  'engraving',
  'biomechanical',
  'trash-polka',
] as const

export type BodyPart = (typeof BODY_PARTS)[number]
export type Style = (typeof STYLES)[number]

/**
 * Allowed range, in centimetres, for the physical size of a tattoo sketch.
 */
export const SIZE_CM_MIN = 1
export const SIZE_CM_MAX = 60

/**
 * Longest / shortest pixel edge of a generated image.
 */
const MAX_IMAGE_EDGE = 1024
const MIN_IMAGE_EDGE = 256

/**
 * Derive the pixel dimensions of the generated image from the physical sketch
 * size requested by the user. The real-world aspect ratio is preserved: the
 * longest edge is scaled to {@link MAX_IMAGE_EDGE} and every edge is rounded to
 * a multiple of 32 (a size diffusion models handle well).
 */
export function imageDimensionsForSize(
  widthCm: number,
  heightCm: number
): { width: number; height: number } {
  const longest = Math.max(widthCm, heightCm)
  const scale = MAX_IMAGE_EDGE / longest

  const toPixels = (cm: number): number => {
    const scaled = Math.round((cm * scale) / 32) * 32
    return Math.min(MAX_IMAGE_EDGE, Math.max(MIN_IMAGE_EDGE, scaled))
  }

  return { width: toPixels(widthCm), height: toPixels(heightCm) }
}

/**
 * Prompt fragments that steer the AI model towards each tattoo style.
 */
export const STYLE_PROMPTS: Record<Style, string> = {
  'line-art': 'fine line art, thin clean continuous outlines, no shading',
  'minimalist': 'minimalist, simple, few elements, lots of negative space',
  'geometric': 'geometric, precise symmetrical shapes, sacred geometry',
  'traditional': 'American traditional tattoo, bold black outlines, old school',
  'neo-traditional': 'neo-traditional tattoo, bold outlines, vivid saturated colors, decorative detail',
  'realistic': 'realistic, detailed shading, fine gradients, lifelike',
  'blackwork': 'blackwork tattoo, solid black ink, high contrast silhouettes',
  'dotwork': 'dotwork tattoo, stippling and pointillism shading',
  'tribal': 'tribal tattoo, bold curved black shapes, polynesian inspired',
  'watercolor': 'watercolor tattoo, soft color splashes and paint drips',
  'japanese': 'Japanese irezumi tattoo, bold outlines, waves and traditional motifs',
  'new-school': 'new school tattoo, cartoonish, exaggerated proportions, bright colors',
  'sketch': 'sketch style tattoo, loose hand-drawn pencil strokes, sketchy lines',
  'ornamental': 'ornamental tattoo, decorative filigree, lace and mandala patterns',
  'surrealism': 'surrealist tattoo, dreamlike imagery, impossible melting composition',
  'engraving': 'engraving tattoo, etching style, fine parallel hatching lines',
  'biomechanical': 'biomechanical tattoo, fused machine and organic anatomy, 3D depth',
  'trash-polka': 'trash polka tattoo, black and red, collage of realism and abstract strokes',
}
