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
}
