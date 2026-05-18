import Tattoo from '#models/tattoo'

/**
 * Payload required to persist a freshly generated tattoo.
 */
export interface CreateTattooData {
  userId: number
  bodyPart: string
  style: string
  /** Real-world tattoo width on the body, in centimetres. */
  widthCm: number
  /** Real-world tattoo height on the body, in centimetres. */
  heightCm: number
  description: string
  finalPrompt: string
  imagePath: string
  seed: number
  /** Pixel width of the generated image. */
  width: number
  /** Pixel height of the generated image. */
  height: number
}

/**
 * Fields that can change when a tattoo is re-generated (edited).
 */
export interface UpdateTattooData {
  description: string
  finalPrompt: string
  imagePath: string
  seed: number
  width: number
  height: number
}

/**
 * The only layer allowed to read/write the `tattoos` table.
 */
export default class TattooRepository {
  /**
   * Persist a new tattoo record.
   */
  async create(data: CreateTattooData): Promise<Tattoo> {
    return Tattoo.create(data)
  }

  /**
   * Apply updated fields to an existing tattoo and persist them.
   */
  async update(tattoo: Tattoo, data: UpdateTattooData): Promise<Tattoo> {
    tattoo.merge(data)
    await tattoo.save()
    return tattoo
  }

  /**
   * List a user's tattoos, newest first.
   */
  async listByUser(userId: number): Promise<Tattoo[]> {
    return Tattoo.query().where('user_id', userId).orderBy('created_at', 'desc')
  }

  /**
   * Find a single tattoo that belongs to the given user.
   */
  async findForUser(id: number, userId: number): Promise<Tattoo | null> {
    return Tattoo.query().where('id', id).andWhere('user_id', userId).first()
  }

  /**
   * Delete a tattoo record.
   */
  async delete(tattoo: Tattoo): Promise<void> {
    await tattoo.delete()
  }
}
