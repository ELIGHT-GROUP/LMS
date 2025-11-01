# Authentication Flow Documentation

## OVERVIEW

Three distinct user types with different registration flows:

- **OWNER**: Created directly (bootstrap/admin creation only)
- **ADMIN**: Invited by OWNER → Registration via invitation link → Profile completion → Permission assignment
- **STUDENT**: Self-registration → Profile completion

---

## ADMIN REGISTRATION FLOW

### 1. OWNER GENERATES INVITATION LINK

**Endpoint:** `POST /api/auth/admin/invite` (OWNER only)

**Request:**

```json
{
  "email": "admin@example.com",
  "role": "ADMIN"
}
```

**Flow:**

1. Validate user is OWNER
2. Check if email not already registered
3. Generate invitation token (unique, random string)
4. Create Invitation record:
   ```json
   {
     "email": "admin@example.com",
     "tokenHash": "hashed_token",
     "role": "ADMIN",
     "status": "PENDING",
     "expiresAt": "2025-11-08T12:00:00Z",
     "invitedBy": "owner_id",
     "createdAt": "2025-11-01T12:00:00Z"
   }
   ```
5. Generate invitation link: `https://lms.example.com/admin/register?token=raw_token`
6. Send link via email (TODO: Email integration)
7. Return invitation link/token

**Response:**

```json
{
  "message": "Invitation sent successfully",
  "data": {
    "invitationLink": "https://lms.example.com/admin/register?token=abc123xyz",
    "expiresAt": "2025-11-08T12:00:00Z"
  }
}
```

**Error Cases:**

- 403: Not authorized (not OWNER)
- 409: Email already registered
- 500: Invitation creation failed

---

### 2. ADMIN REGISTERS WITH INVITATION LINK

**Endpoint:** `POST /api/auth/admin/register`

**Request (Normal Signup):**

```json
{
  "email": "admin@example.com",
  "password": "securePassword123",
  "invitationToken": "abc123xyz"
}
```

**Request (Google Signup):**

```json
{
  "googleToken": "google_id_token",
  "invitationToken": "abc123xyz"
}
```

**Flow (Normal):**

1. Validate invitationToken
2. Find Invitation by tokenHash → 400 if not found/expired
3. Check invitation.status === "PENDING" → 400 if already used/expired
4. Check email matches invitation.email → 400 if mismatch
5. Hash password with bcrypt
6. Create AuthUser with:
   - email, passwordHash/provider
   - role: ADMIN
   - type: "LOCAL"
   - isEmailVerified: true
   - isMobileVerified: false (not required for admin)
   - isAccountVerified: false (until admin profile completed)
   - tokens: []
   - verification_tokens: []
7. Create AdminProfile with minimal data
8. Update Invitation:
   - status: "ACCEPTED"
   - acceptedBy: authUser.id
   - acceptedAt: now
9. Return userId for profile completion

**Flow (Google):**

1. Validate invitationToken
2. Find Invitation → 400 if not found/expired
3. Verify googleToken with Google API → 401 if invalid
4. Extract email from Google token
5. Check email matches invitation.email → 400 if mismatch
6. Create AuthUser with:
   - email from Google
   - provider: GOOGLE
   - providerId: google_sub
   - googleId: google_id
   - role: ADMIN
   - isEmailVerified: true
   - rest same as normal flow
7. Create AdminProfile
8. Update Invitation to ACCEPTED
9. Return userId for profile completion

**Response:**

```json
{
  "message": "Admin registered successfully",
  "data": {
    "userId": "cuid123",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**Error Cases:**

- 400: Invalid or expired invitation token
- 400: Email mismatch with invitation
- 401: Invalid Google token
- 409: Email already registered
- 500: Admin registration failed

---

### 3. ADMIN COMPLETES PROFILE (PUT)

**Endpoint:** `PUT /api/auth/admin/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "firstName": "Ahmed",
  "lastName": "Ali",
  "image": "https://...",
  "type": "SUPER_ADMIN"
}
```

**Flow:**

1. Validate token (middleware)
2. Verify user is ADMIN
3. Find AuthUser and AdminProfile
4. Update AdminProfile:
   - firstName, lastName, image, type
5. Update AuthUser:
   - isAccountVerified: true (mark as setup complete)
6. Return updated profile

**Response:**

```json
{
  "message": "Admin profile updated successfully",
  "data": {
    "id": "cuid123",
    "firstName": "Ahmed",
    "lastName": "Ali",
    "image": "https://...",
    "type": "SUPER_ADMIN",
    "email": "admin@example.com",
    "status": "ACTIVE"
  }
}
```

**Error Cases:**

- 401: Unauthorized
- 403: Not ADMIN role
- 404: User or profile not found
- 500: Profile update failed

---

### 4. OWNER ASSIGNS ADMIN PERMISSIONS

**Endpoint:** `POST /api/auth/admin/:adminId/permissions` (OWNER only)

**Request:**

```json
{
  "permissions": ["create_users", "edit_users", "view_reports"]
}
```

**Flow:**

1. Validate user is OWNER
2. Find admin by adminId → 404 if not found
3. Verify admin role is ADMIN
4. For each permission:
   - Find Permission by name
   - Create AdminPermission record linking admin and permission
5. Return assigned permissions

**Response:**

```json
{
  "message": "Permissions assigned successfully",
  "data": {
    "adminId": "cuid123",
    "permissions": ["create_users", "edit_users", "view_reports"]
  }
}
```

**Error Cases:**

- 403: Not authorized (not OWNER)
- 404: Admin not found
- 400: Invalid permissions
- 500: Permission assignment failed

---

## STUDENT REGISTRATION FLOW

### 1. STUDENT NORMAL REGISTRATION

**Endpoint:** `POST /api/auth/signup`

**Request (Normal Signup):**

```json
{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**Request (Google Signup):**

```json
{
  "googleToken": "google_id_token"
}
```

**Flow (Normal):**

1. Validate input with Zod schema
2. Check if email already exists → 409 if exists
3. Hash password with bcrypt (salt: 10)
4. Create AuthUser with:
   - email, passwordHash
   - provider: LOCAL
   - role: STUDENT
   - type: "LOCAL"
   - isEmailVerified: true (email provided)
   - isMobileVerified: false
   - isAccountVerified: false (until profile completed)
   - maxLoginDevice: 5
   - themeMode: "light"
   - tokens: []
   - verification_tokens: []
5. Create StudentProfile with:
   - signUpVia: "WEB"
   - isProfileCompleted: false
   - status: "PENDING" (awaiting profile completion)
   - approvalStatus: "PENDING"
6. Return userId for profile completion

**Flow (Google):**

1. Validate googleToken with Google API → 401 if invalid
2. Extract email and googleId from token
3. Check if email already exists → 409 if exists
4. Create AuthUser with:
   - email from Google
   - provider: GOOGLE
   - providerId: google_sub
   - googleId: google_id
   - role: STUDENT
   - isEmailVerified: true
   - rest same as normal flow
5. Create StudentProfile with signUpVia: "GOOGLE"
6. Return userId for profile completion

**Response:**

```json
{
  "message": "Student registered successfully",
  "data": {
    "userId": "cuid123",
    "email": "student@example.com"
  }
}
```

**Error Cases:**

- 409: Email already exists
- 401: Invalid Google token
- 500: Registration failed

---

### 2. STUDENT COMPLETES PROFILE (PUT)

**Endpoint:** `PUT /api/auth/student/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "2000-01-15",
  "gender": "MALE",
  "profilePicture": "https://...",
  "pushId": "firebase_push_id",
  "year": 2,
  "nic": "12345-6789012-3",
  "nicPic": "https://...",
  "registerCode": "REG123456",
  "extraDetails": { "field1": "value1" },
  "deliveryDetails": { "address": "123 Main St", "city": "Lahore" }
}
```

**Flow:**

1. Validate token (middleware)
2. Verify user is STUDENT
3. Find AuthUser and StudentProfile
4. Update StudentProfile:
   - firstName, lastName, dob, gender, profilePicture
   - pushId, year, nic, nicPic, registerCode
   - extraDetails, deliveryDetails
   - isProfileCompleted: true
5. Update AuthUser:
   - isAccountVerified: true
6. Return updated profile

**Response:**

```json
{
  "message": "Student profile updated successfully",
  "data": {
    "id": "cuid123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "student@example.com",
    "isProfileCompleted": true,
    "approvalStatus": "PENDING"
  }
}
```

**Error Cases:**

- 401: Unauthorized
- 403: Not STUDENT role
- 404: User or profile not found
- 500: Profile update failed

---

## VERIFICATION & LOGIN FLOWS

### 3. REQUEST EMAIL VERIFICATION CODE

**Endpoint:** `POST /api/auth/request-email-verification`

**Request:**

```json
{
  "userId": "cuid123"
}
```

**Flow:**

1. Validate input
2. Find AuthUser by userId → 404 if not found
3. Check isEmailVerified === false → 400 if already verified
4. Generate verification code (hardcoded "123456" until email integration)
5. Append verification token to authUser.verification_tokens:
   ```json
   {
     "id": "unique_token_id",
     "tokenHash": "123456",
     "type": "VERIFY_EMAIL",
     "expiresAt": "2025-11-01T12:10:00Z",
     "isUsed": false,
     "createdAt": "2025-11-01T12:00:00Z"
   }
   ```
6. Send code via email (TODO: Email integration) - for now just return in response for testing
7. Return userId

**Response:**

```json
{
  "message": "Verification code sent to email",
  "data": {
    "userId": "cuid123",
    "code": "123456"
  }
}
```

**Error Cases:**

- 404: User not found
- 400: Email already verified
- 500: Verification request failed

---

### 4. VERIFY EMAIL CODE

**Endpoint:** `POST /api/auth/verify-email`

**Request:**

```json
{
  "userId": "cuid123",
  "code": "123456"
}
```

**Flow:**

1. Validate input
2. Find AuthUser by userId → 404 if not found
3. Search verification_tokens for matching code:
   - Match: tokenHash === code
   - Type: VERIFY_EMAIL
   - Not used: isUsed === false
   - Not expired: expiresAt > now
4. If no match → 400 Invalid or expired code
5. Mark token as used
6. Update AuthUser:
   - isEmailVerified: true
   - verification_tokens: updated array
7. Return success

**Response:**

```json
{
  "message": "Email verified successfully"
}
```

**Error Cases:**

- 404: User not found
- 400: Invalid or expired code
- 500: Verification failed

---

### 5. LOGIN FLOW

**Endpoint:** `POST /api/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Flow:**

1. Validate input with Zod schema
2. Apply rate limiter (max 5 attempts per 15 minutes)
3. Find AuthUser by email → 404 if not found
4. Compare password with stored hash → 401 if invalid
5. Generate JWT token with payload: { id, role }
   - JWT expires in 24 hours
6. Append token object to authUser.tokens JSON array
7. Update lastLogin timestamp
8. Return token and user profile

**Response:**

```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "id": "cuid123",
    "email": "user@example.com",
    "role": "STUDENT",
    "isEmailVerified": true,
    "isAccountVerified": false,
    "isActive": true
  }
}
```

**Error Cases:**

- 404: User not found
- 401: Invalid password
- 429: Rate limit exceeded
- 500: Login failed

---

### 6. GET AUTH DATA FLOW (Protected)

**Endpoint:** `GET /api/auth/auth-data?userId=cuid123`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Middleware - Token Validation:**

1. Extract token from "Bearer <token>" header
2. Validate JWT format
3. Verify JWT signature using JWT_SECRET
4. Decode JWT to get payload: { id, role }
5. Find AuthUser by userId → 401 if not found
6. Search authUser.tokens JSON array for matching token
7. Validate token is active and not expired → 401 if invalid
8. Attach req.user = { userId, role }
9. Continue to controller

**Controller Flow:**

1. Get userId from query parameter
2. Return user profile

**Response:**

```json
{
  "message": "Auth data fetched successfully",
  "data": {
    "id": "cuid123",
    "email": "user@example.com",
    "role": "STUDENT",
    "isEmailVerified": true,
    "isAccountVerified": false,
    "isActive": true
  }
}
```

**Error Cases:**

- 401: No token / Invalid token / Token expired
- 404: User not found
- 500: Failed to fetch auth data

---

## REQUEST PASSWORD RESET FLOW

### 7. REQUEST PASSWORD RESET

**Endpoint:** `POST /api/auth/reset-password-request`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Flow:**

1. Validate input
2. Apply rate limiter (max 3 attempts per 15 minutes)
3. Find AuthUser by email → 404 if not found
4. Generate reset code (hardcoded "123456" until email integration)
5. Append verification token:
   ```json
   {
     "id": "unique_token_id",
     "tokenHash": "123456",
     "type": "PASSWORD_RESET",
     "expiresAt": "2025-11-01T12:30:00Z",
     "isUsed": false,
     "createdAt": "2025-11-01T12:00:00Z"
   }
   ```
6. Send code via email (TODO) - for now return in response
7. Return userId

**Response:**

```json
{
  "message": "Password reset code sent to email",
  "data": {
    "userId": "cuid123",
    "code": "123456"
  }
}
```

**Error Cases:**

- 404: User not found
- 429: Rate limit exceeded
- 500: Request failed

---

### 8. RESET PASSWORD

**Endpoint:** `POST /api/auth/reset-password`

**Request:**

```json
{
  "userId": "cuid123",
  "code": "123456",
  "newPassword": "newSecurePassword456"
}
```

**Flow:**

1. Validate input
2. Find AuthUser by userId → 404 if not found
3. Search verification_tokens for PASSWORD_RESET code
4. Validate code: not used, not expired, matches → 400 if invalid
5. Mark token as used
6. Hash newPassword
7. Update AuthUser:
   - passwordHash = newHashedPassword
   - passwordChangedAt = now
   - verification_tokens: updated array
8. Return success

**Response:**

```json
{
  "message": "Password reset successfully"
}
```

**Error Cases:**

- 404: User not found
- 400: Invalid or expired code
- 500: Reset failed

---

## Database Schema Reference

### AuthUser Table

| Field               | Type          | Notes                                         |
| ------------------- | ------------- | --------------------------------------------- |
| id                  | CUID          | Primary key                                   |
| email               | TEXT          | Unique, required                              |
| passwordHash        | TEXT          | Hashed password                               |
| passwordChangedAt   | TIMESTAMP     | When password was last changed                |
| provider            | Provider      | LOCAL, GOOGLE, FACEBOOK                       |
| providerId          | TEXT          | Social provider user ID                       |
| googleId            | TEXT          | Google OAuth ID                               |
| role                | Role          | OWNER, ADMIN, STUDENT                         |
| type                | TEXT          | User type (default: "LOCAL")                  |
| isActive            | BOOLEAN       | Account active status                         |
| isEmailVerified     | BOOLEAN       | Email verified                                |
| isAccountVerified   | BOOLEAN       | Account setup complete                        |
| accountStatus       | AccountStatus | ACTIVE, INACTIVE, SUSPENDED, DELETED, PENDING |
| lastLogin           | TIMESTAMP     | Last login time                               |
| maxLoginDevice      | INT           | Max concurrent devices (students only)        |
| themeMode           | TEXT          | LIGHT, DARK                                   |
| tokens              | JSONB         | Array of JWT tokens                           |
| verification_tokens | JSONB         | Array of verification codes                   |
| studentProfileId    | TEXT          | Foreign key to StudentProfile                 |
| adminProfileId      | TEXT          | Foreign key to AdminProfile                   |
| createdAt           | TIMESTAMP     | Creation time                                 |
| updatedAt           | TIMESTAMP     | Last update time                              |

### StudentProfile Table

| Field              | Type      | Notes                            |
| ------------------ | --------- | -------------------------------- |
| id                 | CUID      | Primary key                      |
| authUserId         | TEXT      | Foreign key to AuthUser (unique) |
| firstName          | TEXT      | Optional                         |
| lastName           | TEXT      | Optional                         |
| dob                | TIMESTAMP | Date of birth                    |
| gender             | TEXT      | MALE, FEMALE, OTHER              |
| profilePicture     | TEXT      | Image URL                        |
| signUpVia          | TEXT      | WEB, GOOGLE, APPLE, etc          |
| pushId             | TEXT      | Firebase push notification ID    |
| year               | INT       | Academic year                    |
| nic                | TEXT      | National ID number               |
| nicPic             | TEXT      | NIC photo URL                    |
| registerCode       | TEXT      | Registration code                |
| isProfileCompleted | BOOLEAN   | Profile completion status        |
| approvalStatus     | TEXT      | PENDING, APPROVED, REJECTED      |
| approvedBy         | TEXT      | Admin who approved               |
| approvedAt         | TIMESTAMP | Approval timestamp               |
| status             | TEXT      | PENDING, ACTIVE, INACTIVE        |
| extraDetails       | JSONB     | Custom registration fields       |
| deliveryDetails    | JSONB     | Address, city, postal code, etc  |
| createdAt          | TIMESTAMP | Creation time                    |
| updatedAt          | TIMESTAMP | Last update time                 |

### AdminProfile Table

| Field      | Type      | Notes                        |
| ---------- | --------- | ---------------------------- |
| id         | CUID      | Primary key                  |
| authUserId | TEXT      | Foreign key to AuthUser      |
| firstName  | TEXT      | Optional                     |
| lastName   | TEXT      | Optional                     |
| image      | TEXT      | Profile image URL            |
| type       | TEXT      | ADMIN, SUPER_ADMIN, etc      |
| status     | TEXT      | ACTIVE, INACTIVE             |
| createdBy  | TEXT      | OWNER who created invitation |
| createdAt  | TIMESTAMP | Creation time                |
| updatedAt  | TIMESTAMP | Last update time             |

### Invitation Table

| Field      | Type         | Notes                               |
| ---------- | ------------ | ----------------------------------- |
| id         | CUID         | Primary key                         |
| email      | TEXT         | Invited email address               |
| tokenHash  | TEXT         | Unique hashed invitation token      |
| role       | Role         | ADMIN, OWNER                        |
| status     | InviteStatus | PENDING, ACCEPTED, EXPIRED, REVOKED |
| expiresAt  | TIMESTAMP    | Token expiration (7 days)           |
| invitedBy  | TEXT         | OWNER who sent invitation           |
| acceptedBy | TEXT         | User who accepted (after signup)    |
| acceptedAt | TIMESTAMP    | Acceptance timestamp                |
| createdAt  | TIMESTAMP    | Creation time                       |

### Permission Table

| Field       | Type      | Notes          |
| ----------- | --------- | -------------- |
| id          | CUID      | Primary key    |
| name        | TEXT      | Permission key |
| description | TEXT      | Display name   |
| isActive    | BOOLEAN   | Active status  |
| createdAt   | TIMESTAMP | Creation time  |
| updatedAt   | TIMESTAMP | Last update    |

### AdminPermission Table

| Field          | Type      | Notes                       |
| -------------- | --------- | --------------------------- |
| id             | CUID      | Primary key                 |
| adminProfileId | TEXT      | Foreign key to AdminProfile |
| permissionId   | TEXT      | Foreign key to Permission   |
| isActive       | BOOLEAN   | Active status               |
| createdAt      | TIMESTAMP | Creation time               |
| updatedAt      | TIMESTAMP | Last update time            |

---

## Configuration Reference

### Environment Variables

```
PORT=8080
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=24h
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host/db (with pooler)
DATABASE_URL_DIRECT=postgresql://user:pass@host/db (without pooler)
```

### Rate Limiters

- Login: 5 attempts per 15 minutes
- Email Verification: 3 attempts per 15 minutes
- Password Reset Request: 3 attempts per 15 minutes

### Token & Code Expiry Times

- JWT Token: 24 hours
- Email Verification Code: 10 minutes
- Password Reset Code: 30 minutes
- Invitation Link: 7 days

### Hardcoded Values (Until Integration)

- Verification Code: "123456"
- Password Reset Code: "123456"
