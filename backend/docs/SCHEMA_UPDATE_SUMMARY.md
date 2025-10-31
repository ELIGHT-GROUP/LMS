# Prisma Schema & Models Update Summary

## Date: October 31, 2025

## Task: Update Prisma schema and TypeScript models to match refactored ER diagram

---

## ✅ COMPLETED CHANGES

### 1. **Role Enum - Simplified to 3 Roles**

```prisma
BEFORE:
enum Role {
  OWNER
  ADMIN
  TEACHER
  STUDENT
  CLIENT
}

AFTER:
enum Role {
  OWNER
  ADMIN
  STUDENT
}
```

**Impact**: Removed TEACHER and CLIENT roles, now only OWNER, ADMIN, STUDENT

---

### 2. **Provider Enum - Added**

```prisma
ADDED:
enum Provider {
  LOCAL
  GOOGLE
  FACEBOOK
}
```

**Impact**: Changed from String provider field to typed enum

---

### 3. **AuthUser Model - Major Enhancements**

**ADDED FIELDS:**

- `whatsappNumber` - Optional secondary phone contact
- `passwordChangedAt` - Track password change timestamp
- `googleId` - Unique social login ID (nullable, unique constraint)
- `facebookId` - Unique social login ID (nullable, unique constraint)
- `type` - User type (fee, paid, etc)
- `isAccountVerified` - Account verification status
- `maxLoginDevice` - Maximum concurrent devices allowed
- `themeMode` - User's theme preference (LIGHT/DARK)
- `tokens` - JSON array consolidating all JWT tokens
- `verificationTokens` - JSON array consolidating all OTP codes

**CHANGED FIELDS:**

- `provider` - Changed from String to Provider enum
- Removed relations: `tokens Token[]` and `verificationTokens VerificationToken[]`

**NEW JSON STRUCTURES:**

```typescript
// tokens: Json @default("[]")
[
  {
    id: "token-id",
    token: "jwt-string",
    deviceInfo: { deviceName, deviceType, userAgent },
    ipAddress: "192.168.1.1",
    expireAt: "2024-11-01T10:00:00Z",
    isActive: true,
    createdAt: "2024-10-31T10:00:00Z",
  },
][
  // verification_tokens: Json @default("[]")
  {
    id: "token-id",
    tokenHash: "hashed-otp",
    type: "VERIFY_EMAIL|VERIFY_PHONE|PASSWORD_RESET|INVITE_ADMIN",
    expiresAt: "2024-11-01T10:00:00Z",
    isUsed: false,
    createdAt: "2024-10-31T10:00:00Z",
  }
];
```

---

### 4. **StudentProfile Model - Major Enhancements**

**ADDED FIELDS:**

- `signUpVia` - How student signed up (e.g., "referral", "direct", etc)
- `pushId` - Push notification ID (was pinch_id)
- `year` - Academic year
- `nic` - National ID/Number
- `nicPic` - NIC document image URL
- `registerCode` - Registration/enrollment code
- `isProfileCompleted` - Profile completion flag
- `status` - Student status (VARCHAR)
- `extraDetails` - JSON field for custom registration fields
- `deliveryDetails` - JSON field for delivery address and related info

**REMOVED FIELDS:**

- `extraClasses` - Consolidated into `extraDetails` JSON

**CONSOLIDATED FROM AuthUser** (these should now come from auth_user):

- ~~mobile_no~~ → Use `auth_user.phone_number`
- ~~whatsapp_no~~ → Use `auth_user.whatsapp_number`
- ~~google_id~~ → Use `auth_user.google_id`
- ~~facebook_id~~ → Use `auth_user.facebook_id`
- ~~is_email_verified~~ → Use `auth_user.is_email_verified`
- ~~is_mobile_verified~~ → Use `auth_user.is_mobile_verified`
- ~~is_account_verified~~ → Use `auth_user.is_account_verified`
- ~~last_login_date~~ → Use `auth_user.last_login`
- ~~password_changed_at~~ → Use `auth_user.password_changed_at`
- ~~max_login_device~~ → Use `auth_user.max_login_device`

---

### 5. **AdminProfile Model - Cleanup**

**REMOVED FIELDS:**

- `contactNo` - Consolidated to `auth_user.phone_number`
- `whatsappNo` - Consolidated to `auth_user.whatsapp_number`

**ADDED FIELDS:**

- `email` - Admin email (was missing)
- `type` - Admin type classification
- `status` - Admin status (ACTIVE, INACTIVE)

---

### 6. **Permission Model - Enhancement**

**ADDED FIELD:**

- `isActive` - Permission activation flag (default: true)

**Allows**: Deactivating permissions without deleting them

---

### 7. **AdminPermission Model - Enhancement**

**ADDED FIELDS:**

- `isActive` - Permission assignment activation flag (default: true)
- `updatedAt` - Last update timestamp

**Allows**: Fine-grained permission activation/deactivation per admin

---

### 8. **Invitation Model - No Changes**

Already correctly implemented in Prisma schema. Validates role is ADMIN or OWNER only (enforced in code).

---

### 9. **Token Model - DELETED**

- ❌ Removed from Prisma schema
- ✅ Now stored as JSON array in `AuthUser.tokens`
- ✅ TypeScript type `Token` updated to describe JSON structure

---

### 10. **VerificationToken Model - DELETED**

- ❌ Removed from Prisma schema
- ✅ Now stored as JSON array in `AuthUser.verification_tokens`
- ✅ TypeScript type `VerificationToken` updated to describe JSON structure

---

### 11. **TypeScript Model Files Updated**

**Token.ts:**

```typescript
export type Token = {
  id: string;
  token: string;
  deviceInfo?: { deviceName?; deviceType?; userAgent? };
  ipAddress?: string;
  expireAt: Date | string;
  isActive: boolean;
  createdAt: Date | string;
};

export type TokenPayload = {
  id: string;
  role: "OWNER" | "ADMIN" | "STUDENT";
  iat?: number;
  exp?: number;
};
```

**VerificationToken.ts:**

```typescript
export type VerificationToken = {
  id: string;
  tokenHash: string;
  type: "VERIFY_EMAIL" | "VERIFY_PHONE" | "PASSWORD_RESET" | "INVITE_ADMIN";
  expiresAt: Date | string;
  isUsed: boolean;
  createdAt: Date | string;
};

export type VerificationTokenRequest = {
  type: "VERIFY_EMAIL" | "VERIFY_PHONE" | "PASSWORD_RESET" | "INVITE_ADMIN";
  expiryMinutes?: number;
};
```

---

## 📊 CURRENT STATUS

### ✅ Schema Generation

```
npx prisma generate → SUCCESS (Prisma Client v5.22.0)
```

### ⚠️ TypeScript Compilation Errors (EXPECTED)

```
src/middleware/auth.middleware.ts:42 → prisma.token.findUnique() - no longer exists
src/services/auth.service.ts:153 → prisma.token.create() - no longer exists

Total: 2 errors (both related to removed Token model)
```

These errors are **EXPECTED** and will be fixed in the next phase when we update auth.service.ts and auth.middleware.ts to work with JSON arrays.

---

## 🔄 NEXT PHASE: Code Updates Required

### Phase 1: Auth Service Updates

**File**: `src/services/auth.service.ts`

**Changes Needed**:

1. `registerUser()` - Add new StudentProfile fields
2. `loginUser()` - Append to tokens JSON array instead of creating Token record
3. `requestSendOtp()` - Append to verification_tokens JSON array
4. `verifyMobileNumber()` - Search in verification_tokens array
5. `requestPasswordReset()` - Append to verification_tokens array with type=PASSWORD_RESET
6. `resetPassword()` - Update password_changed_at along with password_hash

### Phase 2: Auth Middleware Updates

**File**: `src/middleware/auth.middleware.ts`

**Changes Needed**:

1. `authMiddleware()` - Search token in JSON array instead of querying Token table
2. Implement token validation from JSON object
3. Check expiration and isActive from JSON token object

### Phase 3: Auth Types Updates

**File**: `src/types/index.ts`

**Changes Needed**:

1. Update IUserProfile to include new AuthUser fields
2. Update registration DTOs for StudentProfile fields
3. Add types for token/verification handling from JSON

### Phase 4: Database Migration

Create migration to consolidate existing Token and VerificationToken data into JSON arrays in AuthUser.

---

## 📋 FIELD MAPPING REFERENCE

### AuthUser Fields (27 total)

```
Core: id, email, phone_number, whatsapp_number, password_hash, password_changed_at
Social: provider, provider_id, google_id, facebook_id
User: role, type, is_active, is_email_verified, is_mobile_verified, is_account_verified
Account: account_status, last_login, max_login_device, theme_mode
Profile: student_profile_id, admin_profile_id
Tokens: tokens (JSON), verification_tokens (JSON)
Audit: created_at, updated_at
```

### StudentProfile Fields (23 total)

```
Core: id, auth_user_id
Personal: first_name, last_name, date_of_birth, gender, profile_picture
Enrollment: sign_up_via, push_id, register_code, year
Identity: nic, nic_pic
Status: is_profile_completed, approval_status, approved_by, approved_at, status
Flexible: extra_details (JSON), delivery_details (JSON)
Audit: created_at, updated_at
```

### AdminProfile Fields (10 total)

```
Core: id, auth_user_id, first_name, last_name, email, image, type, status, created_by
Audit: created_at, updated_at
```

---

## 🎯 VALIDATION CHECKLIST

- [x] Prisma schema updated
- [x] Prisma client generated (0 warnings)
- [x] Role enum simplified to 3 roles
- [x] AuthUser model enhanced with all new fields
- [x] StudentProfile model enhanced with all new fields
- [x] AdminProfile cleaned up (removed duplicate contacts)
- [x] Permission model updated with is_active
- [x] AdminPermission model updated with is_active and updated_at
- [x] Token model deleted from schema
- [x] VerificationToken model deleted from schema
- [x] TypeScript types updated for Token and VerificationToken
- [x] Invitation model validated (role restricted to ADMIN|OWNER)
- [ ] Auth service updated (next phase)
- [ ] Auth middleware updated (next phase)
- [ ] TypeScript compilation 0 errors (pending code updates)
- [ ] Database migration created (next phase)

---

## 📝 NOTES

1. **JSON vs Separate Tables Trade-off:**
   - ✅ **Pros**: Simpler auth_user model, no separate table queries, better single-request fetch
   - ⚠️ **Cons**: Can't query tokens directly by field, array operations needed, need cleanup logic for expired tokens

2. **Migration Strategy:**
   - Existing Token records must be migrated to JSON
   - Existing VerificationToken records must be migrated to JSON
   - No data loss during migration

3. **Active Token Cleanup:**
   - Need to implement background job or hook to remove expired tokens from JSON array
   - Keep array manageable size (consider retention policy)

4. **Backward Compatibility:**
   - TypeScript types maintained for developer convenience
   - JSON structure mirrors old model structure for easier transition

---

## 🚀 READY FOR NEXT PHASE

Schema updates complete. Ready to update auth service and middleware code.
