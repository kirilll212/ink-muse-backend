import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'users';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('full_name');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('full_name').nullable();
        });
    }
}
//# sourceMappingURL=1778957781556_drop_full_name_from_users_table.js.map