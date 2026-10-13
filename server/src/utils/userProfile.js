export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    timezone: user.timezone,
    createdAt: user.createdAt,
  };
}
