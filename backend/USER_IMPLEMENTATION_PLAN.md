# Completion Plan: User & Auth Implementation

**Date**: October 30, 2025  
**Status**: Planning Phase  
**Current Progress**: asyncHandler middleware ✅ implemented

---

## Executive Summary

We have a **partially complete** LMS backend with auth implemented but user management incomplete. The task is to complete the user service and controller to enable CRUD operations on user profiles.

**Current State:**

- ✅ Auth Service: Fully implemented (7 methods)
- ✅ Auth Controller: Fully implemented (7 handlers with asyncHandler)
- ⚠️ Auth Routes: Fully implemented but template responses
- ❌ User Service: **MISSING** - No implementation
- ❌ User Controller: **MISSING** - No implementation
- ⚠️ User Routes: Templates only - need implementation

---

## Phase 1: User Service Implementation

### What Needs to Be Done

Create `src/services/user.service.ts` with the following methods:

#### 1. **getUserById(userId: string)**

```typescript
Purpose: Fetch single user profile
Input: userId
Output: User profile (without password)
Errors:
  - NotFoundError (404) if user not found
  - InternalServerError (500) on DB error
Uses: Prisma User.findUnique()
```

#### 2. **getAllUsers(filters?, pagination?)**

```typescript
Purpose: List all users (admin endpoint)
Input: Optional filters, pagination
Output: User list with pagination metadata
Errors:
  - InternalServerError (500) on DB error
Features:
  - Filter by role, account_status, is_verified
  - Pagination (limit, offset)
  - Sorted by created_at desc
Uses: Prisma User.findMany() + User.count()
```

#### 3. **updateUser(userId: string, updateData)**

```typescript
Purpose: Update user profile information
Input: userId, updateData (partial user fields)
Output: Updated user object
Errors:
  - NotFoundError (404) if user not found
  - BadRequestError (400) if email/phone already exists
  - InternalServerError (500) on DB error
Allowed Updates:
  - first_name, last_name
  - profile_picture
  - theme_mode
  - account_status (admin only)
Uses: Prisma User.update()
```

#### 4. **deleteUser(userId: string)**

```typescript
Purpose: Soft delete user (mark as inactive)
Input: userId
Output: Success message
Errors:
  - NotFoundError (404) if user not found
  - InternalServerError (500) on DB error
Behavior:
  - Set is_active = false
  - Set account_status = "DELETED"
  - Keep data for audit purposes (soft delete)
Uses: Prisma User.update()
```

#### 5. **changePassword(userId: string, oldPassword, newPassword)**

```typescript
Purpose: Change user password (must verify old password)
Input: userId, oldPassword, newPassword
Output: Success message
Errors:
  - NotFoundError (404) if user not found
  - UnauthorizedError (401) if old password invalid
  - BadRequestError (400) if new password invalid
  - InternalServerError (500) on DB error
Validation:
  - Old password must match current password
  - New password must be different
  - New password length >= 6 chars
Uses: Prisma User.findUnique(), bcrypt.compare(), bcrypt.hash()
```

#### 6. **updateUserRole(userId: string, newRole)**

```typescript
Purpose: Change user role (admin endpoint)
Input: userId, newRole
Output: Updated user
Errors:
  - NotFoundError (404) if user not found
  - BadRequestError (400) if invalid role
  - InternalServerError (500) on DB error
Valid Roles: ADMIN, TEACHER, STUDENT, CLIENT
Uses: Prisma User.update()
```

#### 7. **searchUsers(query: string, limit?)**

```typescript
Purpose: Search users by name or email/phone
Input: query string, optional limit
Output: Matching users list
Errors:
  - InternalServerError (500) on DB error
Search In: first_name, last_name, email, phone_number
Uses: Prisma User.findMany() with OR conditions
```

---

## Phase 2: User Controller Implementation

Create `src/controllers/user.controller.ts` with the following handlers:

#### 1. **getProfile**

```typescript
Endpoint: GET /api/users/profile
Auth: Required (authMiddleware)
Handler:
  - Extract userId from req.user
  - Call UserService.getUserById(userId)
  - Return user profile
Response: IUserProfile
```

#### 2. **updateProfile**

```typescript
Endpoint: PUT /api/users/profile
Auth: Required
Body: { first_name?, last_name?, profile_picture?, theme_mode? }
Handler:
  - Extract userId from req.user
  - Validate input fields
  - Call UserService.updateUser(userId, body)
  - Return updated profile
Response: Updated IUserProfile
```

#### 3. **changePassword**

```typescript
Endpoint: POST /api/users/change-password
Auth: Required
Body: { oldPassword, newPassword, confirmPassword }
Handler:
  - Extract userId from req.user
  - Validate passwords match
  - Call UserService.changePassword(userId, oldPassword, newPassword)
  - Return success message
Response: { success: true, message: "..." }
```

#### 4. **getAllUsers** (Admin endpoint)

```typescript
Endpoint: GET /api/users
Auth: Required
Authorization: Admin only
Query: { role?, status?, page?, limit?, search? }
Handler:
  - Extract pagination from query
  - Call UserService.getAllUsers(filters, pagination)
  - Return paginated user list
Response: { users: [], pagination: { total, page, limit } }
```

#### 5. **getUserById** (Admin endpoint)

```typescript
Endpoint: GET /api/users/:id
Auth: Required
Authorization: Admin or self
Params: { id: userId }
Handler:
  - Extract userId from params
  - Call UserService.getUserById(userId)
  - Return user profile
Response: IUserProfile
```

#### 6. **updateUser** (Admin endpoint)

```typescript
Endpoint: PUT /api/users/:id
Auth: Required
Authorization: Admin only
Body: { first_name?, last_name?, profile_picture?, account_status?, role? }
Handler:
  - Extract userId from params
  - Validate admin privileges
  - Call UserService.updateUser(userId, body)
  - Return updated user
Response: Updated IUserProfile
```

#### 7. **deleteUser** (Admin endpoint)

```typescript
Endpoint: DELETE /api/users/:id
Auth: Required
Authorization: Admin only
Params: { id: userId }
Handler:
  - Extract userId from params
  - Call UserService.deleteUser(userId)
  - Return success message
Response: { success: true, message: "User deleted" }
```

#### 8. **searchUsers** (Admin endpoint)

```typescript
Endpoint: GET /api/users/search/:query
Auth: Required
Authorization: Admin only
Params: { query: search string }
Query: { limit? }
Handler:
  - Extract search query from params
  - Call UserService.searchUsers(query, limit)
  - Return matching users
Response: IUserProfile[]
```

#### 9. **getUserStats** (Admin endpoint)

```typescript
Endpoint: GET /api/users/stats
Auth: Required
Authorization: Admin only
Handler:
  - Count users by role
  - Count users by account_status
  - Calculate total verified/unverified
  - Get last 7 days registration trend
  - Return statistics
Response: { totalUsers, byRole, byStatus, verified, trend }
```

---

## Phase 3: Update User Routes

Update `src/routes/user.routes.ts` to implement all endpoints:

```typescript
// Public - Self
GET  /api/users/profile           → getProfile (auth required)
PUT  /api/users/profile           → updateProfile (auth required)
POST /api/users/change-password   → changePassword (auth required)

// Admin Only
GET  /api/users                   → getAllUsers (admin + auth required)
GET  /api/users/search/:query     → searchUsers (admin + auth required)
GET  /api/users/:id               → getUserById (admin + auth required)
GET  /api/users/stats             → getUserStats (admin + auth required)
PUT  /api/users/:id               → updateUser (admin + auth required)
DELETE /api/users/:id             → deleteUser (admin + auth required)
```

**All handlers must be wrapped with asyncHandler**

---

## Data Model Reference

### User Model (Prisma)

```
id: string (CUID)
email: string? (unique, optional)
phone_number: string (unique, required)
password: string
first_name: string?
last_name: string?
profile_picture: string?
role: string (ADMIN, TEACHER, STUDENT, CLIENT)
account_status: string (ACTIVE, INACTIVE, SUSPENDED, DELETED)
is_active: boolean
is_verified: boolean
verification_code: string?
verification_code_expires_at: DateTime?
theme_mode: string (LIGHT, DARK)
last_login: DateTime?
created_at: DateTime
updated_at: DateTime
```

### Token Model (Prisma)

```
id: string
user_id: string (FK → User)
token: string (unique)
expire_at: DateTime
is_active: boolean
created_at: DateTime
updated_at: DateTime
```

---

## Error Handling Reference

### Custom Error Classes

```typescript
BadRequestError(400)       - Invalid input
UnauthorizedError(401)     - Invalid credentials
ForbiddenError(403)        - Access denied
NotFoundError(404)         - Resource not found
ConflictError(409)         - Resource already exists
InternalServerError(500)   - Server error
```

All errors automatically caught by **asyncHandler** and processed by global error handler.

---

## Response Format Reference

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* response data */
  }
}
```

### List Response (Pagination)

```json
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "users": [ { User }, ... ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "pages": 15
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## Type Definitions Needed

### Update `src/types/index.ts` with:

```typescript
// User profile (without sensitive data)
interface IUserProfile {
  id: string;
  email?: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  role: string;
  account_status: string;
  is_active: boolean;
  is_verified: boolean;
  theme_mode: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// User update DTO
interface IUpdateUserDto {
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  theme_mode?: string;
  account_status?: string; // Admin only
  role?: string; // Admin only
}

// Change password DTO
interface IChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User stats response
interface IUserStats {
  totalUsers: number;
  byRole: { [role: string]: number };
  byStatus: { [status: string]: number };
  verified: number;
  unverified: number;
  lastWeekRegistrations: { date: string; count: number }[];
}

// Paginated response
interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

---

## Implementation Checklist

### Service Layer (`user.service.ts`)

- [ ] Import Prisma, error classes, logger
- [ ] Implement `getUserById()`
- [ ] Implement `getAllUsers()` with pagination
- [ ] Implement `updateUser()`
- [ ] Implement `deleteUser()`
- [ ] Implement `changePassword()`
- [ ] Implement `updateUserRole()`
- [ ] Implement `searchUsers()`
- [ ] Add proper error handling to all methods
- [ ] Add logging for all operations
- [ ] TypeScript compilation: 0 errors

### Controller Layer (`user.controller.ts`)

- [ ] Import asyncHandler, UserService, error classes
- [ ] Implement `getProfile` handler
- [ ] Implement `updateProfile` handler
- [ ] Implement `changePassword` handler
- [ ] Implement `getAllUsers` handler
- [ ] Implement `getUserById` handler
- [ ] Implement `updateUser` handler
- [ ] Implement `deleteUser` handler
- [ ] Implement `searchUsers` handler
- [ ] Implement `getUserStats` handler
- [ ] Wrap all handlers with asyncHandler
- [ ] Add input validation
- [ ] TypeScript compilation: 0 errors

### Routes (`user.routes.ts`)

- [ ] Import UserController, middleware
- [ ] Create public routes:
  - [ ] GET /profile
  - [ ] PUT /profile
  - [ ] POST /change-password
- [ ] Create admin routes:
  - [ ] GET / (list all)
  - [ ] GET /search/:query
  - [ ] GET /stats
  - [ ] GET /:id
  - [ ] PUT /:id
  - [ ] DELETE /:id
- [ ] Add authMiddleware to all routes
- [ ] Add authorize middleware to admin routes
- [ ] All handlers wrapped with asyncHandler
- [ ] TypeScript compilation: 0 errors

### Documentation

- [ ] Create USER_SERVICE.md with implementation details
- [ ] Create USER_ROUTES.md with endpoint documentation
- [ ] Update README.md with new endpoints
- [ ] Add API examples for all new endpoints

### Testing

- [ ] Test getProfile (success)
- [ ] Test updateProfile (success and error)
- [ ] Test changePassword (success and error)
- [ ] Test getAllUsers (pagination, filters)
- [ ] Test getUserById (success and not found)
- [ ] Test updateUser (success and validation)
- [ ] Test deleteUser (success and not found)
- [ ] Test searchUsers (results and empty)
- [ ] Test getUserStats (calculation)
- [ ] Test error scenarios (401, 403, 404, 400)

---

## Files to Create/Modify

### New Files to Create

1. ✅ `src/services/user.service.ts` - User business logic
2. ✅ `src/controllers/user.controller.ts` - User request handlers
3. ✅ `USER_IMPLEMENTATION_PLAN.md` - This document
4. ✅ `USER_API_REFERENCE.md` - API documentation

### Files to Modify

1. ⚠️ `src/routes/user.routes.ts` - Add all endpoints
2. ⚠️ `src/types/index.ts` - Add UserDTO types
3. ⚠️ `QUICK_START.md` - Add user endpoints documentation
4. ⚠️ `README.md` - Update with new endpoints

---

## Code Quality Standards

✅ **TypeScript:**

- Strict mode enabled
- Full type annotations
- No `any` types
- Proper generics usage

✅ **Error Handling:**

- All errors are custom classes
- Descriptive error messages
- Proper HTTP status codes
- asyncHandler catches all

✅ **Logging:**

- Info level: successful operations
- Error level: failures with context
- No sensitive data logged

✅ **Documentation:**

- JSDoc comments on all methods
- Inline comments for complex logic
- Type definitions clear

✅ **Code Style:**

- ESLint compliant
- Prettier formatted
- Consistent naming conventions

---

## Estimated Implementation Time

| Task                         | Estimated Time |
| ---------------------------- | -------------- |
| User Service (8 methods)     | 1-2 hours      |
| User Controller (9 handlers) | 1-2 hours      |
| User Routes implementation   | 30 min         |
| Type definitions             | 30 min         |
| Compilation & testing        | 30 min         |
| Documentation                | 30 min         |
| **TOTAL**                    | **4-6 hours**  |

---

## Dependencies & Setup

### Already Available

- ✅ Prisma ORM configured
- ✅ asyncHandler middleware
- ✅ Custom error classes
- ✅ Response utilities
- ✅ JWT authentication
- ✅ Logging system
- ✅ TypeScript strict mode

### No New Dependencies Needed

- bcryptjs (already installed)
- express (already installed)
- prisma (already installed)

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue 1: Password hashing performance**

- Solution: Use async bcrypt.hash() (already in auth service)

**Issue 2: Concurrent updates**

- Solution: Use Prisma transactions for multi-step operations

**Issue 3: Data exposure (passwords)**

- Solution: Always exclude password from queries (select: { password: false })

**Issue 4: Authorization bypass**

- Solution: Always verify admin role in handlers

**Issue 5: Invalid state transitions**

- Solution: Validate account_status values

---

## Success Criteria

✅ **All User Endpoints Working**

- GET /api/users/profile (self)
- PUT /api/users/profile (update self)
- POST /api/users/change-password (change own password)
- GET /api/users (admin - list all)
- GET /api/users/:id (admin - get one)
- PUT /api/users/:id (admin - update any)
- DELETE /api/users/:id (admin - delete)
- GET /api/users/search/:query (admin - search)
- GET /api/users/stats (admin - statistics)

✅ **All Tests Pass**

- No TypeScript errors
- No runtime errors
- Proper error handling
- Correct status codes
- Consistent response format

✅ **Documentation Complete**

- All endpoints documented
- All types defined
- All error scenarios listed
- Examples provided

---

## Next Steps

1. **Review this plan** - Ensure all requirements clear
2. **Create user.service.ts** - Implement all 8 methods
3. **Create user.controller.ts** - Implement all 9 handlers
4. **Update user.routes.ts** - Add all endpoints
5. **Update types/index.ts** - Add required DTOs
6. **Test all endpoints** - Manual and automated
7. **Create API documentation** - Swagger/OpenAPI
8. **Deploy and monitor** - Track performance

---

## References

- **Auth Service**: `src/services/auth.service.ts` (7 methods, reference implementation)
- **Auth Controller**: `src/controllers/auth.controller.ts` (7 handlers, reference implementation)
- **Error Classes**: `src/utils/errors.ts`
- **Response Utilities**: `src/utils/response.ts`
- **Prisma Schema**: `prisma/schema.prisma`
- **Types**: `src/types/index.ts`
- **asyncHandler Docs**: `ASYNCHANDLER_IMPLEMENTATION.md`

---

## Questions Before Starting?

Before implementation, clarify:

1. Should email be updatable? (Currently unique, may conflict)
2. Should deleted users be truly deleted or soft-deleted? (Plan uses soft-delete)
3. Should user stats include data analytics or just counts?
4. Should search be case-insensitive? (Recommend yes)
5. Should pagination have a max limit? (Recommend 100)
6. Should admin be able to reset user passwords directly? (Recommend no, for security)

---

**Ready to implement? Let's proceed step by step!** 🚀
