import User from '#models/user';
export default class UserRepository {
    async findByEmail(email) {
        return User.findBy('email', email);
    }
    async findByUsername(username) {
        return User.findBy('username', username);
    }
    async create(data) {
        return User.create(data);
    }
    async update(user, data) {
        user.merge(data);
        await user.save();
        return user;
    }
    async updatePassword(user, password) {
        user.password = password;
        await user.save();
    }
}
//# sourceMappingURL=user_repository.js.map