/**
 * User Model
 * ===========
 * User entity definition
 *
 * NOTE: This model is defined in prisma/schema.prisma
 * Prisma auto-generates types from the schema
 *
 * Access via Prisma client:
 * const prisma = getPrisma();
 * const user = await prisma.user.findUnique({ where: { id: userId } });
 */

export type User = {
  id: string;
  email: string;
  phone_number: string;
  password: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  role: string;
  account_status: string;
  is_active: boolean;
  is_verified: boolean;
  verification_code: string | null;
  verification_code_expires_at: Date | null;
  theme_mode: string;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
};

export default User;
