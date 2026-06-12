import type { UserDto } from '@ai-interview/types';
import type { UserDoc } from '../../models';

export function toUserDto(user: UserDoc): UserDto {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    emailVerified: user.emailVerified,
    targetRoles: user.targetRoles,
    experienceLevel: user.experienceLevel,
    createdAt: user.createdAt.toISOString(),
  };
}
