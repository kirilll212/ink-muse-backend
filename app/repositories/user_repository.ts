import User from '#models/user'

/**
 * Fields required to create a new user.
 */
export interface CreateUserData {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
}

/**
 * Profile fields that can be updated after registration.
 */
export interface UpdateUserData {
  firstName?: string
  lastName?: string
  username?: string
  phone?: string | null
  avatarPath?: string | null
}

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
   * Find a user by their (unique) username.
   */
  async findByUsername(username: string): Promise<User | null> {
    return User.findBy('username', username)
  }

  /**
   * Persist a new user record.
   */
  async create(data: CreateUserData): Promise<User> {
    return User.create(data)
  }

  /**
   * Apply updated profile fields to a user and persist them.
   */
  async update(user: User, data: UpdateUserData): Promise<User> {
    user.merge(data)
    await user.save()
    return user
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
