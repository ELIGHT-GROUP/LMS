/**
 * Token Model
 * ===========
 * JWT Token tracking entity definition
 *
 * NOTE: This model is defined in prisma/schema.prisma
 * Prisma auto-generates types from the schema
 *
 * Access via Prisma client:
 * const prisma = getPrisma();
 * const token = await prisma.token.findUnique({ where: { token: tokenString } });
 */

export type Token = {
  id: string;
  user_id: string;
  token: string;
  expire_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};
