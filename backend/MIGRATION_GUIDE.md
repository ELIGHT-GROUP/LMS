# Next Steps: Database Migration & Testing

## 1. Create & Apply Database Migration

Since this is a **complete schema redesign**, you'll need to create a migration:

```bash
cd d:\LMS\LMS\backend

# Create and apply migration in one step
npx prisma migrate dev --name "refactor_auth_system"

# Or separately:
npx prisma migrate dev --create-only  # Create migration file
npx prisma migrate deploy             # Apply migration
```

This will:

- ⚠️ Drop old `users` table (backup data first if needed!)
- ⚠️ Drop old `tokens` table
- Create new `auth_users` table
- Create new `student_profiles` table
- Create new `admin_profiles` table
- Create new `tokens` table
- Create new `verification_tokens` table
- Create new `invitations` table
- Create new `permissions` table
- Create new `admin_permissions` table

## 2. Update API Clients

All endpoint bodies now use **camelCase** instead of snake_case:

### Before (Old)

```json
POST /api/auth/signup
{
  "phone_number": "+1234567890",
  "password": "securepass123",
  "email": "user@example.com",
  "role": "STUDENT"
}
```

### After (New)

```json
POST /api/auth/signup
{
  "phoneNumber": "+1234567890",
  "password": "securepass123",
  "email": "user@example.com",
  "role": "STUDENT"
}
```

## 3. Updated Request/Response Contracts

| Endpoint                                | Field Changes                                               |
| --------------------------------------- | ----------------------------------------------------------- |
| `POST /api/auth/signup`                 | `phone_number` → `phoneNumber`                              |
| `POST /api/auth/login`                  | `phone_number` → `phoneNumber`                              |
| `POST /api/auth/request-otp`            | `phone_number` → `phoneNumber`                              |
| `POST /api/auth/reset-password-request` | `phone_number` → `phoneNumber`                              |
| **All responses**                       | `is_verified` → `isEmailVerified`, `is_active` → `isActive` |

## 4. TypeScript Type Safety

All types are now properly inferred from Prisma schema:

```typescript
import { prisma } from "@/config/database";

// ✅ Type-safe auth user
const user = await prisma.authUser.findUnique({
  where: { phoneNumber: "+1234567890" },
});

// ✅ Type-safe student profile
const student = await prisma.studentProfile.findUnique({
  where: { authUserId: user.id },
});

// ✅ Type-safe token
const token = await prisma.token.findFirst({
  where: {
    authUserId: user.id,
    isActive: true,
    expireAt: { gt: new Date() },
  },
});
```

## 5. Testing Checklist

- [ ] Database migration runs without errors
- [ ] New tables created with correct columns
- [ ] Field names in DB are snake_case
- [ ] User registration works with new schema
- [ ] User login generates token with correct fields
- [ ] Token validation in middleware checks `isActive` and `expireAt`
- [ ] OTP request/verify works
- [ ] Password reset works
- [ ] Auth data endpoint returns camelCase field names
- [ ] Zod validation catches incorrect field names (old snake_case)

## 6. Known Issues & Workarounds

### If migration fails on production database:

```bash
# Create safe migration with explicit drops
npx prisma migrate dev --name "refactor_auth_system_safe"
```

### To backup before migration:

```bash
# Create dump of old tables
pg_dump -U postgres -d lms_db -t users -t tokens > backup_auth_old.sql
```

### To rollback if needed:

```bash
# Revert to previous migration
npx prisma migrate resolve --rolled-back "migration_name"
```

## 7. Files Modified

✅ `prisma/schema.prisma` - Complete schema redesign  
✅ `src/services/auth.service.ts` - All methods updated  
✅ `src/middleware/auth.middleware.ts` - Field names updated  
✅ `src/controllers/auth.controller.ts` - DTO field names  
✅ `src/types/index.ts` - All interfaces use camelCase  
✅ `src/validators/auth.validators.ts` - Validation schemas updated

## 8. Compilation Status

```bash
$ npx tsc --noEmit
# Exit code: 0 ✅ (No errors)

$ npx prisma generate
# ✅ Generated Prisma Client (v5.22.0)
```

## 9. What Changed in the Database

### Old Schema

```
users table (1 table, 16 columns)
tokens table (1 table, 7 columns)
```

### New Schema

```
auth_users table (central auth, 16 columns)
student_profiles table (profile & approval, 11 columns)
admin_profiles table (admin details, 8 columns)
tokens table (JWT tracking, 9 columns with new fields)
verification_tokens table (OTP & reset codes, 7 columns)
invitations table (admin invite flow, 11 columns)
permissions table (permission definitions, 4 columns)
admin_permissions table (join table, 4 columns)
```

## Ready?

When you're ready to migrate:

```bash
# Final check - no TypeScript errors
npx tsc --noEmit

# Schema validation
npx prisma validate

# Run migration
npx prisma migrate dev --name "refactor_auth_system"
```

Then test the API with new camelCase field names!
