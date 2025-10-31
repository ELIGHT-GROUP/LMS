/**
 * Database Models Index
 * =====================
 * Re-exports all Prisma-generated model types
 * These are automatically generated from prisma/schema.prisma
 *
 * NOTE: Type-only definitions (like Token, VerificationToken) are moved to /types/auth.types.ts
 * This folder should only contain Prisma model re-exports and database-related entities
 */

// Re-export Prisma client and types
export type { Prisma } from "@prisma/client";

// Re-export all Prisma-generated model types
export type {
  AuthUser,
  StudentProfile,
  AdminProfile,
  Permission,
  AdminPermission,
  Invitation,
} from "@prisma/client";

// Export Prisma enums for type safety
export { Role, AccountStatus, InviteStatus } from "@prisma/client";

/**
 * Initialize models - not needed with Prisma (auto-generated)
 * Kept for backward compatibility
 */
export const initializeModels = async (): Promise<void> => {
  // Prisma generates types automatically from schema.prisma
  // No manual initialization needed
};
