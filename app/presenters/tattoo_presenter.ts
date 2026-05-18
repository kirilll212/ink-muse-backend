import Tattoo from '#models/tattoo'

/**
 * Shape the public JSON representation of a tattoo returned by the API.
 *
 * Internal fields (the on-disk file name, the full AI prompt) are not exposed;
 * instead a ready-to-use relative `imageUrl` is provided for the frontend.
 */
export function presentTattoo(tattoo: Tattoo) {
  return {
    id: tattoo.id,
    bodyPart: tattoo.bodyPart,
    style: tattoo.style,
    widthCm: tattoo.widthCm,
    heightCm: tattoo.heightCm,
    description: tattoo.description,
    imageUrl: `/api/tattoos/images/${tattoo.imagePath}`,
    width: tattoo.width,
    height: tattoo.height,
    seed: tattoo.seed,
    createdAt: tattoo.createdAt.toISO(),
  }
}
