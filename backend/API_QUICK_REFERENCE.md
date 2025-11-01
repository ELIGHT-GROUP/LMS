## Quick API Testing Reference

Base URL: `http://localhost:5000/api/auth`

### Test Hardcoded Values

- Email verification code: `123456`
- Password reset code: `123456`
- Token expiry: 24 hours after login

---

## 🔵 COMMON ENDPOINTS (Both STUDENT & ADMIN)

### 1️⃣ Login

```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Rate Limited:** 5 attempts/15min

---

### 2️⃣ Request Email Verification

```http
POST /request-email-verification
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "cuid123"
}
```

**Rate Limited:** 5 attempts/1 hour per user
**Returns:** Code "123456" for testing

---

### 3️⃣ Verify Email

```http
POST /verify-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "cuid123",
  "code": "123456"
}
```

---

### 4️⃣ Request Password Reset

```http
POST /reset-password-request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Returns:** Code "123456" for testing

---

### 5️⃣ Reset Password

```http
POST /reset-password
Content-Type: application/json

{
  "userId": "cuid123",
  "code": "123456",
  "newPassword": "newpass123"
}
```

---

### 6️⃣ Get Auth Data

```http
GET /auth-data
Authorization: Bearer <token>
```

---

## 🟢 STUDENT ENDPOINTS

### 1️⃣ Register Student (Email/Password)

```http
POST /signup
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**Returns:** userId for profile completion

---

### 2️⃣ Register Student (Google)

```http
POST /signup
Content-Type: application/json

{
  "googleToken": "google_token_from_frontend"
}
```

---

### 3️⃣ Complete Student Profile

```http
PUT /student/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "2000-01-15T00:00:00Z",
  "gender": "MALE",
  "profilePicture": "https://...",
  "pushId": "firebase_id",
  "year": 2,
  "nic": "12345-6789012-3",
  "nicPic": "https://...",
  "registerCode": "REG123456",
  "extraDetails": {},
  "deliveryDetails": {
    "address": "123 Main St",
    "city": "Lahore",
    "country": "Pakistan"
  }
}
```

---

## 🔴 ADMIN ENDPOINTS

### 1️⃣ Create Admin Invitation (OWNER ONLY)

```http
POST /admin/invite
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "email": "admin@example.com",
  "role": "ADMIN"
}
```

**Requires:** OWNER role
**Returns:** invitationLink with token

---

### 2️⃣ Register Admin (Email/Password)

```http
POST /admin/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpass123",
  "invitationToken": "token_from_link"
}
```

---

### 3️⃣ Register Admin (Google)

```http
POST /admin/register
Content-Type: application/json

{
  "googleToken": "google_token",
  "invitationToken": "token_from_link"
}
```

---

### 4️⃣ Complete Admin Profile

```http
PUT /admin/profile
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Ali",
  "image": "https://...",
  "type": "SUPER_ADMIN"
}
```

---

### 5️⃣ Assign Admin Permissions (OWNER ONLY)

```http
POST /admin/<adminId>/permissions
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "permissions": ["create_users", "edit_users", "delete_users", "view_reports"]
}
```

**Requires:** OWNER role

---

## 📊 Standard Response Format

### Success Response

```json
{
  "success": true,
  "message": "Action successful",
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔒 Authentication Header Format

All protected endpoints require:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImN1aWQxMjMiLCJyb2xlIjoiU1RKRU5UIiwiaWF0IjoxNjk5NzY5NjAwLCJleHAiOjE2OTk4NTYwMDB9.xyz
```

Get token from login response and use in Authorization header.

---

## 📝 User Roles

- **STUDENT**: Self-registered users (can use all COMMON endpoints + STUDENT endpoints)
- **ADMIN**: Invited by OWNER (can use all COMMON endpoints + ADMIN endpoints, except admin/invite and admin/:id/permissions)
- **OWNER**: Created via database seeding (can use ALL endpoints including admin/invite and admin/:id/permissions)

---

## ⏱️ Rate Limits

- Login: **5 attempts per 15 minutes**
- Email Verification: **5 attempts per 1 hour** (per user)
- All requests: **100 requests per 15 minutes** (default)

---

## ✅ Testing Checklist

### Student Flow

- [ ] POST /signup with email/password
- [ ] PUT /student/profile with token
- [ ] POST /login to get token
- [ ] GET /auth-data with token

### Admin Flow

- [ ] POST /admin/invite (as OWNER) to get token
- [ ] POST /admin/register with invitation token
- [ ] PUT /admin/profile with token
- [ ] POST /admin/:id/permissions (as OWNER)

### Common Features

- [ ] POST /login (both roles)
- [ ] POST /request-email-verification
- [ ] POST /verify-email with "123456"
- [ ] POST /reset-password-request
- [ ] POST /reset-password with "123456"

---

## 🐛 Troubleshooting

| Error                 | Cause                 | Fix                                     |
| --------------------- | --------------------- | --------------------------------------- |
| 401 Unauthorized      | Invalid/missing token | Include `Authorization: Bearer <token>` |
| 403 Forbidden         | Not OWNER             | Use OWNER token for admin endpoints     |
| 409 Conflict          | Email exists          | Use different email                     |
| 429 Too Many Requests | Rate limit exceeded   | Wait 15 minutes/1 hour                  |
| 400 Bad Request       | Invalid input         | Check request body format               |
| 404 Not Found         | Resource missing      | Verify ID/email                         |
| 500 Server Error      | Database error        | Check logs, try again                   |

---

## Files Used

- Test with: `common-auth.http`, `student-auth.http`, `admin-auth.http`
- Detailed docs: `AUTH_FLOW.md`, `AUTH_FLOW_VERIFICATION.md`, `COMPLETION_SUMMARY.md`
- REST Client: VS Code "REST Client" extension by Huachao Mao

---

Generated: November 1, 2025
