import User from '#models/user'

/**
 * Shape the public JSON representation of a user returned by the API.
 *
 * The password is never exposed; the stored avatar file name is turned into a
 * ready-to-use relative URL, and a convenience `fullName` is provided.
 */
export function presentUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    username: user.username,
    email: user.email,
    phone: user.phone ?? null,
    avatarUrl: user.avatarPath ? `/api/users/avatars/${user.avatarPath}` : null,
    createdAt: user.createdAt?.toISO() ?? null,
  }
}
