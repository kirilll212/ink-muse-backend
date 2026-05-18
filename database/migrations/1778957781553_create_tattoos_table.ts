import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tattoos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('body_part').notNullable()
      table.string('style').notNullable()

      // Real-world tattoo size on the body, in centimetres.
      table.decimal('width_cm', 5, 1).notNullable()
      table.decimal('height_cm', 5, 1).notNullable()

      table.text('description').notNullable()
      table.text('final_prompt').notNullable()
      table.string('image_path').notNullable()
      table.integer('seed').notNullable()

      // Pixel dimensions of the generated image.
      table.integer('width').notNullable()
      table.integer('height').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
