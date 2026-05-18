export function presentUser(user) {
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
    };
}
//# sourceMappingURL=user_presenter.js.map