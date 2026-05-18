import User from '#models/user'

/**
 * The only layer allowed to read/write the `users` table. Services depend on
 * this abstraction instead of touching the Lucid model directly.
 */
export default class UserRepository {
  /**
   * Find a user by their (unique) email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    return User.findBy('email', email)
  }

  /**
   * Persist a new user record.
   */
  async create(data: { fullName: string; email: string; password: string }): Promise<User> {
    return User.create(data)
  }

  /**
   * Set a new password for the user. The User model's auth mixin hashes the
   * password automatically before it is written to the database.
   */
  async updatePassword(user: User, password: string): Promise<void> {
    user.password = password
    await user.save()
  }
}
