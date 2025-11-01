# LMS Backend - Authentication System Documentation

**Status:** ✅ **COMPLETE & READY FOR TESTING**  
**Last Updated:** November 1, 2025  
**Version:** 1.0

---

## 📋 Documentation Index

### 📚 Core Documentation

| File                                                     | Purpose                                    | Audience               |
| -------------------------------------------------------- | ------------------------------------------ | ---------------------- |
| [AUTH_FLOW.md](./docs/AUTH_FLOW.md)                      | Complete authentication flow specification | Architects, Developers |
| [AUTH_FLOW_VERIFICATION.md](./AUTH_FLOW_VERIFICATION.md) | Implementation verification checklist      | QA, Developers         |
| [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)         | Tasks completed summary                    | Project Managers       |
| [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)       | Quick testing reference                    | QA, Testers            |

### 🧪 API Testing Files (REST Client)

| File                                     | Endpoints           | Use Case                                                       |
| ---------------------------------------- | ------------------- | -------------------------------------------------------------- |
| [common-auth.http](./common-auth.http)   | 6 common endpoints  | Testing shared endpoints (login, verification, password reset) |
| [student-auth.http](./student-auth.http) | 3 student endpoints | Testing student flow (signup, profile, complete flow)          |
| [admin-auth.http](./admin-auth.http)     | 5 admin endpoints   | Testing admin flow (invite, register, permissions)             |

---

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd backend
npm install
npm run dev
```

### 2. Test with REST Client

- Install VS Code Extension: "REST Client" by Huachao Mao
- Open any `.http` file
- Click "Send Request" above each endpoint
- Use files:
  - `common-auth.http` for login, verification, password reset
  - `student-auth.http` for student registration flow
  - `admin-auth.http` for admin invitation/registration flow

### 3. Key Test Values

- **Verification Code:** `123456`
- **Password Reset Code:** `123456`
- **API Base URL:** `http://localhost:5000/api/auth`
- **Token Expiry:** 24 hours

---

## 📊 System Overview

### 12 API Endpoints Implemented

#### COMMON (6 endpoints) - Both STUDENT & ADMIN

```
POST   /login                              Login with email/password
POST   /request-email-verification        Request verification code
POST   /verify-email                       Verify email with code
POST   /reset-password-request             Request password reset
POST   /reset-password                     Reset password with code
GET    /auth-data                          Get authenticated user profile
```

#### STUDENT (2 endpoints)

```
POST   /signup                             Register new student
PUT    /student/profile                    Complete student profile
```

#### ADMIN (4 endpoints)

```
POST   /admin/invite                       Create admin invitation (OWNER only)
POST   /admin/register                     Register admin with invitation
PUT    /admin/profile                      Complete admin profile
POST   /admin/:adminId/permissions         Assign permissions (OWNER only)
```

---

## 🔐 Authentication Flows

### STUDENT FLOW

1. **Signup** - Email/password or Google → Get userId
2. **Complete Profile** - Required fields with auth token
3. **Login** - Email/password → Get JWT token
4. **Verify Email** - Optional, request code → submit code
5. **Password Reset** - Request code → submit new password

### ADMIN FLOW

1. **Get Invited** - OWNER sends invitation → Get token in email
2. **Register** - Use invitation token, email, password/Google
3. **Complete Profile** - Required fields with auth token
4. **Get Permissions** - OWNER assigns permissions
5. **Login** - Email/password → Get JWT token

### COMMON ACTIONS

- **Login** - Works for both STUDENT and ADMIN
- **Email Verification** - Works for both roles
- **Password Reset** - Works for both roles
- **View Profile** - Works for both roles

---

## 🛡️ Security Features

- **JWT Authentication** - 24-hour expiring tokens
- **Password Hashing** - Bcrypt with 10 rounds
- **Rate Limiting** - Login (5/15min), Email verification (5/1hour)
- **Role-Based Access** - OWNER, ADMIN, STUDENT
- **One-Time Codes** - Email verification and password reset
- **Token Validation** - JSON array storage with active/expiry checks

---

## 📁 File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts           ✅ Common endpoints (6)
│   │   ├── student-auth.controller.ts   ✅ Student endpoints (2)
│   │   └── admin-auth.controller.ts     ✅ Admin endpoints (4)
│   ├── services/
│   │   ├── auth.service.ts              ✅ StudentAuthService (8 methods)
│   │   └── admin-auth.service.ts        ✅ AdminAuthService (4 methods)
│   ├── middleware/
│   │   ├── auth.middleware.ts           ✅ authMiddleware, ownerMiddleware
│   │   ├── security.middleware.ts       ✅ Rate limiters (login, email verification)
│   │   └── validation.middleware.ts     ✅ Zod validation
│   ├── routes/
│   │   └── auth.routes.ts               ✅ 12 endpoints configured
│   ├── validators/
│   │   └── auth.validators.ts           ✅ 12 Zod schemas
│   └── types/
│       └── auth.types.ts                ✅ TypeScript interfaces
├── docs/
│   ├── AUTH_FLOW.md                     ✅ Complete flow specification
│   └── auth-er.puml                     ✅ Entity relationship diagram
├── prisma/
│   └── schema.prisma                    ✅ Database schema
├── common-auth.http                     ✅ Testing: Common endpoints
├── student-auth.http                    ✅ Testing: Student flow
├── admin-auth.http                      ✅ Testing: Admin flow
├── API_QUICK_REFERENCE.md               ✅ Quick testing guide
├── AUTH_FLOW_VERIFICATION.md            ✅ Implementation verification
└── COMPLETION_SUMMARY.md                ✅ Tasks completed
```

---

## ✅ Implementation Checklist

### Services

- ✅ StudentAuthService (8 methods)
- ✅ AdminAuthService (4 methods)

### Controllers

- ✅ AuthController - Common endpoints (6)
- ✅ StudentAuthController - Student endpoints (2)
- ✅ AdminAuthController - Admin endpoints (4)

### Middleware

- ✅ authMiddleware - JWT validation
- ✅ ownerMiddleware - OWNER role check
- ✅ loginRateLimiter - 5 per 15 minutes
- ✅ emailVerificationRateLimiter - 5 per 1 hour per user

### Validators (Zod)

- ✅ registerStudentSchema
- ✅ adminInvitationSchema
- ✅ adminRegistrationSchema
- ✅ loginSchema
- ✅ updateStudentProfileSchema
- ✅ updateAdminProfileSchema
- ✅ emailVerificationRequestSchema
- ✅ emailVerificationSchema
- ✅ passwordResetRequestSchema
- ✅ passwordResetSchema
- ✅ assignPermissionsSchema

### Database

- ✅ AuthUser table (JWT tokens, verification codes)
- ✅ StudentProfile table
- ✅ AdminProfile table
- ✅ Invitation table
- ✅ AdminPermission table

### Testing

- ✅ common-auth.http (6 endpoints)
- ✅ student-auth.http (2 endpoints + full flow)
- ✅ admin-auth.http (4 endpoints + full flow)

### Documentation

- ✅ AUTH_FLOW.md (complete specifications)
- ✅ AUTH_FLOW_VERIFICATION.md (verification)
- ✅ COMPLETION_SUMMARY.md (tasks done)
- ✅ API_QUICK_REFERENCE.md (testing guide)

### Code Quality

- ✅ TypeScript: 0 errors
- ✅ All routes configured
- ✅ All middleware applied
- ✅ All validators in use
- ✅ All error cases handled
- ✅ TODO comments removed

---

## 🧪 Testing Guide

### For Each Endpoint

1. **Open .http file** - Choose appropriate file based on endpoint type
2. **Update token** - Use token from previous login response
3. **Click "Send Request"** - Button appears above each request
4. **Check response** - Compare with documentation

### Common Test Sequence

**STUDENT:**

1. POST /signup → get userId
2. PUT /student/profile → complete profile
3. POST /login → get token
4. GET /auth-data → verify profile

**ADMIN:**

1. POST /admin/invite (as OWNER) → get invitation link
2. POST /admin/register → use invitation token
3. PUT /admin/profile → complete profile
4. POST /admin/:id/permissions (as OWNER) → assign permissions

**COMMON:**

1. POST /login → get token (already tested above)
2. POST /request-email-verification → request code
3. POST /verify-email → use code "123456"
4. POST /reset-password-request → request code
5. POST /reset-password → reset with code "123456"

---

## 📞 Troubleshooting

### Issue: 401 Unauthorized

**Cause:** Missing or invalid token  
**Fix:** Include `Authorization: Bearer <token>` header

### Issue: 403 Forbidden

**Cause:** User role not authorized  
**Fix:** Verify user role for endpoint (check OWNER requirement)

### Issue: 409 Conflict

**Cause:** Email already registered  
**Fix:** Use different email address

### Issue: 429 Too Many Requests

**Cause:** Rate limit exceeded  
**Fix:** Wait 15 minutes (login) or 1 hour (email verification)

### Issue: 400 Bad Request

**Cause:** Invalid request body  
**Fix:** Check request format against .http file examples

### For More Info

- See `API_QUICK_REFERENCE.md` for troubleshooting table
- Check `AUTH_FLOW_VERIFICATION.md` for expected behaviors
- Review error cases in each endpoint documentation

---

## 🔗 Related Documentation

- **Database Schema:** See `prisma/schema.prisma`
- **Entity Relationships:** See `docs/auth-er.puml`
- **API Flow Details:** See `docs/AUTH_FLOW.md`
- **Implementation Details:** See `AUTH_FLOW_VERIFICATION.md`

---

## 🎯 Next Steps

### Immediate (Testing)

1. Start backend: `npm run dev`
2. Open `common-auth.http`
3. Test all endpoints
4. Verify responses match documentation

### Short Term (Integration)

1. Create OWNER user via database seed
2. Test complete admin flow end-to-end
3. Test email sending integration
4. Test Google OAuth integration

### Medium Term (Frontend)

1. Implement student registration UI
2. Implement admin registration UI
3. Implement login/logout UI
4. Integrate with auth system

### Long Term (Enhancement)

1. Permission validation middleware
2. Admin dashboard
3. User management interface
4. Audit logging

---

## 📞 Support

### Quick Links

- **Status:** ✅ Complete and ready for testing
- **Version:** 1.0
- **Last Updated:** November 1, 2025
- **Database:** PostgreSQL (Neon)
- **Runtime:** Node.js 22+
- **Framework:** Express 4.21+
- **ORM:** Prisma 5.22+

### Files Modified

- `src/middleware/auth.middleware.ts` - Added ownerMiddleware
- `src/middleware/security.middleware.ts` - Added emailVerificationRateLimiter
- `src/routes/auth.routes.ts` - Applied middlewares to routes
- `src/controllers/auth.controller.ts` - Removed TODO comments

### Files Created

- `common-auth.http` - Common endpoints testing
- `student-auth.http` - Student flow testing
- `admin-auth.http` - Admin flow testing
- `API_QUICK_REFERENCE.md` - Quick reference
- `AUTH_FLOW_VERIFICATION.md` - Verification document
- `COMPLETION_SUMMARY.md` - Completion summary

---

**🟢 Status: COMPLETE - Ready for Testing & Integration**

For questions or issues, refer to the appropriate documentation file or check the inline code comments.
