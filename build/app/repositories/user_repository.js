import User from '#models/user';
export default class UserRepository {
    async findByEmail(email) {
        return User.findBy('email', email);
    }
    async create(data) {
        return User.create(data);
    }
    async updatePassword(user, password) {
        user.password = password;
        await user.save();
    }
}
//# sourceMappingURL=user_repository.js.map