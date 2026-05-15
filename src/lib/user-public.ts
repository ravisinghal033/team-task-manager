import type { User } from "@prisma/client";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _p, ...rest } = user;
  return rest;
}
