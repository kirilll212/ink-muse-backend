import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/**
 * A single AI-generated tattoo sketch owned by a user.
 */
export default class Tattoo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare bodyPart: string

  @column()
  declare style: string

  /**
   * Real-world width of the tattoo on the body, in centimetres.
   *
   * PostgreSQL returns `numeric` columns as strings, so `consume` casts the
   * value back to a JavaScript number when the model is hydrated.
   */
  @column({ consume: (value) => (value === null ? value : Number(value)) })
  declare widthCm: number

  /**
   * Real-world height of the tattoo on the body, in centimetres.
   */
  @column({ consume: (value) => (value === null ? value : Number(value)) })
  declare heightCm: number

  /**
   * The raw description typed by the user.
   */
  @column()
  declare description: string

  /**
   * The full prompt that was actually sent to the AI model.
   */
  @column()
  declare finalPrompt: string

  /**
   * File name of the generated image stored on disk.
   */
  @column()
  declare imagePath: string

  @column()
  declare seed: number

  @column()
  declare width: number

  @column()
  declare height: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
