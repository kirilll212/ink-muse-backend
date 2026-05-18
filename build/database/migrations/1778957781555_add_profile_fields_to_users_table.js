import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'users';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('first_name').nullable();
            table.string('last_name').nullable();
            table.string('username').nullable().unique();
            table.string('phone').nullable();
            table.string('avatar_path').nullable();
        });
        this.defer(async (db) => {
            const users = await db.from('users').select('id', 'full_name', 'email');
            for (const user of users) {
                const parts = String(user.full_name ?? '')
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean);
                const firstName = parts[0] || 'User';
                const lastName = parts.slice(1).join(' ') || '';
                const username = `${String(user.email).split('@')[0]}_${user.id}`
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, '');
                await db
                    .from('users')
                    .where('id', user.id)
                    .update({ first_name: firstName, last_name: lastName, username });
            }
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('first_name');
            table.dropColumn('last_name');
            table.dropColumn('username');
            table.dropColumn('phone');
            table.dropColumn('avatar_path');
        });
    }
}
//# sourceMappingURL=1778957781555_add_profile_fields_to_users_table.js.map