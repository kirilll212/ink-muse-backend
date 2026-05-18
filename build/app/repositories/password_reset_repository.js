import PasswordResetCode from '#models/password_reset_code';
export default class PasswordResetRepository {
    async create(data) {
        return PasswordResetCode.create(data);
    }
    async findLatestForUser(userId) {
        return PasswordResetCode.query()
            .where('user_id', userId)
            .orderBy('created_at', 'desc')
            .first();
    }
    async deleteForUser(userId) {
        await PasswordResetCode.query().where('user_id', userId).delete();
    }
}
//# sourceMappingURL=password_reset_repository.js.map