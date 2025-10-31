# Type Definition Naming Convention Research

## Analysis of Common Patterns Used by Engineers

---

## **PATTERN 1: Separate `/models` vs `/types` Folders**

### **Approach A: Models = DB Models, Types = DTO/Interface Types** ✅ MOST COMMON

```
src/
├── models/           ← DATABASE MODEL DEFINITIONS (Prisma auto-generated)
│   ├── AuthUser.ts
│   ├── StudentProfile.ts
│   └── index.ts
├── types/            ← APPLICATION TYPE DEFINITIONS (DTOs, interfaces, requests)
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── api.types.ts
│   └── index.ts
└── services/
```

**Usage:**

- `/models` = Mirror your Prisma schema (re-exported from Prisma)
- `/types` = Request DTOs, Response DTOs, Helper types, Service interfaces

**Example in Industry:**

- **NestJS** (official documentation) - uses `/entities` for DB models, `/dtos` for API types
- **TypeORM** - uses `/entities` for DB models, `/dto` for transfer objects
- **Prisma Best Practices** - suggests keeping generated types separate from API types

---

### **Approach B: Everything in `/models` with Clear Naming** ⚠️ LESS CLEAR

```
src/
├── models/
│   ├── AuthUser.ts              ← Type only (re-export from Prisma)
│   ├── AuthUser.model.ts        ← Type only
│   ├── auth.types.ts            ← Type only (unclear)
│   ├── auth.dto.ts              ← Request/Response types
│   └── index.ts
```

**Issues:**

- Mixing purposes in one folder confuses developers
- No clear separation between DB types and API types
- Hard to find specific type files

---

### **Approach C: Unified `/types` for Everything** ❌ ANTI-PATTERN

```
src/
├── types/
│   ├── AuthUser.ts              ← DB model type
│   ├── StudentProfile.ts        ← DB model type
│   ├── IRegisterUserDto.ts      ← Request DTO
│   ├── auth.service.types.ts    ← Service types
│   └── index.ts
```

**Problems:**

- `/types` becomes a dumping ground (1000+ lines)
- Breaks the logical separation of concerns
- Hard to navigate
- Doesn't reflect actual code organization

---

## **PATTERN 2: Prisma Type Generation & Re-export**

### **How Industry Handles Prisma Types:**

```typescript
// GOOD: src/models/index.ts
import type { AuthUser, StudentProfile, AdminProfile } from "@prisma/client";

export type { AuthUser, StudentProfile, AdminProfile };
```

**Key Point:** Prisma auto-generates types from schema.prisma. Engineers re-export them from a consistent location.

### **What NOT to Do:**

```typescript
// BAD: Manual type duplication
export type AuthUser = {
  id: string;
  email: string;
  // ... manually recreating what Prisma already generates
};
```

---

## **PATTERN 3: JSON Field Types**

### **Industry Standard for JSON Fields in TypeScript:**

When you have JSON fields in Prisma (like `tokens: Json`), the pattern is:

```typescript
// Option A: Separate type file (RECOMMENDED)
// src/types/token.types.ts
export type Token = {
  id: string;
  token: string;
  expireAt: Date | string;
  isActive: boolean;
};

// Option B: Inline in utilities
// src/utils/token.utils.ts
export namespace TokenUtils {
  export type Token = {
    /* ... */
  };
}

// Option C: In domain service
// src/services/auth/auth.types.ts
export type Token = {
  /* ... */
};
```

### **Where to Keep JSON Type Definitions:**

```
BEST PRACTICE for your case:
src/
├── types/
│   ├── auth.types.ts         ← AuthUser-related types including Token, VerificationToken
│   ├── student.types.ts      ← StudentProfile-related types
│   ├── admin.types.ts        ← AdminProfile-related types
│   └── index.ts
```

This way:

- JSON structure types live with their parent model types
- Easy to find related types
- Better code organization

---

## **PATTERN 4: File Naming Conventions**

### **4.1 For Database Model Type Files (in /models):**

```
✅ CONSISTENT NAMING:
AuthUser.ts           ← One file per model
StudentProfile.ts     ← PascalCase matching Prisma model name
AdminProfile.ts

❌ INCONSISTENT:
auth.types.ts         ← Should be in /types, not /models
auth.model.ts         ← Confusing - is it a model or type?
token.ts              ← Ambiguous - is it code or type?
```

### **4.2 For Application Type Files (in /types):**

```
✅ RECOMMENDED PATTERN (by most engineers):
auth.types.ts         ← Group by domain
user.types.ts         ← One file per feature
student.types.ts
admin.types.ts
common.types.ts       ← Shared types

OR

✅ ALTERNATIVE PATTERN:
dtos.ts               ← Separate request/response
interfaces.ts         ← Service interfaces
utilities.ts          ← Utility types

❌ NOT RECOMMENDED:
Token.ts              ← Too specific for /types, unless it's a major concept
VerificationToken.ts  ← Better as part of auth.types.ts
```

---

## **PATTERN 5: What Goes Where - Decision Matrix**

| Type                        | Location           | Filename          | Example                                          |
| --------------------------- | ------------------ | ----------------- | ------------------------------------------------ |
| **Database model type**     | `/models`          | `ModelName.ts`    | `AuthUser.ts`                                    |
| **Re-exported from Prisma** | `/models/index.ts` | N/A               | `export type { AuthUser } from "@prisma/client"` |
| **JSON structure type**     | `/types`           | `domain.types.ts` | `auth.types.ts` (contains Token type)            |
| **Request DTO**             | `/types`           | `domain.types.ts` | `IRegisterUserDto` in `auth.types.ts`            |
| **Response DTO**            | `/types`           | `domain.types.ts` | `IUserProfile` in `user.types.ts`                |
| **Service interface**       | `/types`           | `domain.types.ts` | `IAuthService` in `auth.types.ts`                |
| **Utility types**           | `/types`           | `common.types.ts` | `Pagination<T>`, `ApiResponse<T>`                |

---

## **PATTERN 6: Industry Examples**

### **Example 1: NestJS (Framework Standard)**

```
src/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── types/          ← API types, DTOs
│       └── api.types.ts
├── modules/
│   ├── auth/
│   │   ├── entities/   ← DB models (like Prisma)
│   │   ├── dtos/       ← Request/Response DTOs
│   │   ├── auth.service.ts
│   │   └── auth.controller.ts
```

**Key Pattern**: Clear separation between entities (DB) and DTOs (API)

---

### **Example 2: TypeORM Project**

```
src/
├── entity/            ← Database models (@Entity)
│   ├── AuthUser.ts
│   ├── StudentProfile.ts
├── dto/               ← Data Transfer Objects
│   ├── CreateUserDto.ts
│   ├── UpdateUserDto.ts
├── types/             ← Helper types
│   └── common.types.ts
```

**Key Pattern**: Explicit DTOs folder for request/response types

---

### **Example 3: Modern Prisma Projects**

```
src/
├── db/                ← Database-related
│   ├── models/        ← Prisma type re-exports
│   ├── migrations/
├── types/             ← Application types
│   ├── auth.types.ts
│   ├── api.types.ts
├── services/
├── controllers/
```

**Key Pattern**: Explicit `/db/models` for Prisma types

---

## **PATTERN 7: Handling JSON Field Types**

### **Where should `Token` and `VerificationToken` types go?**

```
OPTION A: In /types/auth.types.ts (RECOMMENDED) ✅
│
├─ src/types/auth.types.ts
│  ├─ export type Token = { ... }
│  ├─ export type VerificationToken = { ... }
│  ├─ export interface IRegisterUserDto { ... }
│  ├─ export interface ILoginUserDto { ... }
│  └─ export interface IAuthService { ... }
│
└─ Rationale: All auth-related types (DB, JSON, DTOs) are together

---

OPTION B: Keep in /models (CURRENT APPROACH) ⚠️
│
├─ src/models/Token.ts
├─ src/models/VerificationToken.ts
│
└─ Rationale: These are derived from DB model, so close to DB
             BUT: Creates confusion because Token.ts doesn't have implementation code

---

OPTION C: Separate /utils/types for JSON structures ❌
│
├─ src/utils/token.types.ts
├─ src/utils/verification.types.ts
│
└─ Rationale: Not a common pattern, confuses purpose
```

---

## **RECOMMENDATION FOR YOUR PROJECT**

### **Your Current Situation:**

```
You have:
- src/models/Token.ts         ← Type-only file (no implementation)
- src/models/VerificationToken.ts ← Type-only file (no implementation)
- src/types/                  ← DTOs and interfaces
```

### **RECOMMENDED REFACTORING:**

**Move Token and VerificationToken to /types:**

```
BEFORE:
src/
├── models/
│   ├── AuthUser.ts
│   ├── Token.ts               ← Type only
│   ├── VerificationToken.ts   ← Type only
│   └── index.ts
├── types/
│   ├── auth.types.ts
│   └── index.ts

AFTER:
src/
├── models/
│   ├── AuthUser.ts
│   ├── StudentProfile.ts
│   └── index.ts               ← Re-export from @prisma/client
├── types/
│   ├── auth.types.ts          ← Contains Token, VerificationToken, DTOs
│   ├── user.types.ts          ← Contains StudentProfile types
│   ├── admin.types.ts         ← Contains AdminProfile types
│   └── index.ts
```

### **Why This is Better:**

1. ✅ **Clear Separation:** `/models` = DB models (from Prisma), `/types` = App types
2. ✅ **Consistency:** Aligns with NestJS, TypeORM patterns
3. ✅ **Maintainability:** All auth types in one place
4. ✅ **Scalability:** Easy to add new types (RequestDTOs, ResponseDTOs, etc.)
5. ✅ **Industry Standard:** Matches what most engineers do

### **File Structure:**

```typescript
// src/types/auth.types.ts
export interface IRegisterUserDto {
  email?: string;
  phoneNumber: string;
  password: string;
  role?: "STUDENT" | "ADMIN" | "OWNER";
}

export interface ILoginUserDto {
  phoneNumber: string;
  password: string;
}

export type Token = {
  id: string;
  token: string;
  deviceInfo?: { deviceName?: string; deviceType?: string };
  ipAddress?: string;
  expireAt: Date | string;
  isActive: boolean;
  createdAt: Date | string;
};

export type VerificationToken = {
  id: string;
  tokenHash: string;
  type: "VERIFY_EMAIL" | "VERIFY_PHONE" | "PASSWORD_RESET" | "INVITE_ADMIN";
  expiresAt: Date | string;
  isUsed: boolean;
  createdAt: Date | string;
};

export interface IAuthService {
  registerUser(dto: IRegisterUserDto): Promise<any>;
  loginUser(dto: ILoginUserDto): Promise<any>;
}
```

---

## **SUMMARY & BEST PRACTICE**

### **The Industry Standard Pattern:**

```
├── /models       → Database model types (Prisma auto-generated)
│   ├── Entities exported from @prisma/client
│   └── One file per model
│
├── /types        → Application types, DTOs, interfaces
│   ├── One file per domain (auth.types.ts, user.types.ts, etc.)
│   ├── Grouped by feature, not by type kind
│   └── Contains: DTOs, JSON types, service interfaces
│
├── /services     → Business logic
│   └── Uses types from /types folder
│
├── /controllers  → API endpoints
│   └── Uses types from /types folder
```

### **Decision for Token.ts and VerificationToken.ts:**

| Question                         | Answer                                                  |
| -------------------------------- | ------------------------------------------------------- |
| Should Token.ts stay in /models? | ❌ NO - It's not a DB model, just a JSON type           |
| Where should it go?              | ✅ Move to `/types/auth.types.ts`                       |
| Should we rename it?             | ✅ YES - Use `auth.types.ts` for all auth types         |
| Is this a common pattern?        | ✅ YES - Used by NestJS, TypeORM, Prisma best practices |

---

## **ACTION ITEMS FOR YOUR PROJECT**

1. **Delete** `src/models/Token.ts` and `src/models/VerificationToken.ts`
2. **Move** Token and VerificationToken type definitions to `src/types/auth.types.ts`
3. **Update** `src/models/index.ts` to only re-export Prisma models
4. **Update** `src/types/index.ts` to export auth types
5. **Update** import statements in auth.service.ts and auth.middleware.ts

---
