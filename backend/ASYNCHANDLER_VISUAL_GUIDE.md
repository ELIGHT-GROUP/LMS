# Visual AsyncHandler Reference Guide

## Quick Reference

### Pattern Recognition

```typescript
// ✅ CORRECT: asyncHandler wrapped
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
  })
);

// ❌ WRONG: No asyncHandler
router.post("/login", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user); // ← Unhandled promise rejection risk
});

// ❌ WRONG: Manual try-catch (redundant with asyncHandler)
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error); // ← asyncHandler already does this!
    }
  })
);
```

---

## Visual Error Flow Diagram

```
HTTP Request
    │
    ▼
Express App
    │
    ├─ Security Middleware
    │  ├─ Helmet
    │  ├─ CORS
    │  └─ Body Parser
    │
    ├─ Rate Limiter (if protected)
    │  └─ Check limits
    │
    ├─ Auth Middleware (if protected)
    │  └─ Verify JWT
    │
    ├─ asyncHandler(handler) ◄──────────── KEY COMPONENT
    │  │
    │  ├─ Handler Logic
    │  │  │
    │  │  ├─ Success ───────────────────┐
    │  │  │                             │
    │  │  └─ Error Thrown              │
    │  │     │                          │
    │  │     ▼                          │
    │  │ catch(error)                   │
    │  │     │                          │
    │  │     └─ next(error) ────┐       │
    │  │                        │       │
    │  └────────────────────────┼───────┤
    │                           │       │
    ▼                           │       │
Global Error Handler     Global Error Handler
    │                           │       │
    ├─ Format Error ◄───────────┘       │
    │                                   │
    └─ Send JSON Response ◄─────────────┘

Success: 200 + JSON
Error:   4xx/5xx + Error JSON
```

---

## Middleware Chain Visualization

### Protected Route with asyncHandler

```
User Request
    │
    ▼
┌────────────────────────────────────────┐
│ Express App Global Middleware          │
│ ┌──────────────────────────────────────┤
│ │ 1. Helmet Security Headers           │
│ └───────────┬────────────────────────┬─┤
│ ┌───────────▼──────┐     ┌───────────▼┐│
│ │ 2. CORS          │     │ 3. Compression││
│ └───────────┬──────┘     └───────────┬─┤
│ ┌───────────▼──────────────────────────┤
│ │ 4. Body Parser (Parse JSON)          │
│ └───────────┬──────────────────────────┤
│ ┌───────────▼──────────────────────────┐
│ │ 5. HTTP Logger (Log request)         │
│ └───────────┬──────────────────────────┘
└─────────────┼──────────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Route-Specific      │
    │ Middleware          │
    ├─────────────────────┤
    │ 6. Rate Limiter     │ (if configured)
    │    (Check limits)   │
    └────────┬────────────┘
             │
    ┌────────▼────────────┐
    │ 7. Auth Middleware  │ (if protected)
    │    (Verify JWT)     │
    │    (Attach user)    │
    └────────┬────────────┘
             │
    ┌────────▼──────────────────────┐
    │ 8. asyncHandler(handler)       │ ◄─── YOUR BUSINESS LOGIC
    │                               │
    │ ┌──────────────────────────────┤
    │ │ Your Handler Code:          │
    │ │ • Validate input            │
    │ │ • Query database            │
    │ │ • Call services             │
    │ │ • Process results           │
    │ │ • Send response             │
    │ │                             │
    │ │ ERROR? ──────────┐          │
    │ │ catch & log      │          │
    │ └──────────────────┼──────────┤
    └───────────────────┼──────────┘
              (error or success)
                      │
              ┌───────▼──────────┐
              │ IF ERROR:        │
              │ next(error) ────►│
              └──────────────────┘
                      │
              ┌───────▼──────────────────┐
              │ Global Error Handler     │
              │ • Get status code        │
              │ • Get error message      │
              │ • Log error details      │
              │ • Format JSON response   │
              │ • Send to client         │
              └──────────────────────────┘
                      │
                      ▼
              User Gets Response
              {
                "success": false,
                "message": "...",
                "statusCode": 400|401|404|500
              }
```

---

## Decision Tree: Should I Use asyncHandler?

```
Is the route handler async?
│
├─ NO (sync function)
│  └─ Do NOT use asyncHandler
│     (No need, no errors to catch)
│
└─ YES (async function)
   │
   ├─ Does it query database?
   │  └─ YES → USE asyncHandler ✅
   │
   ├─ Does it call external APIs?
   │  └─ YES → USE asyncHandler ✅
   │
   ├─ Does it use async services?
   │  └─ YES → USE asyncHandler ✅
   │
   ├─ Does it await Promises?
   │  └─ YES → USE asyncHandler ✅
   │
   └─ Does it have try-catch already?
      └─ YES → REMOVE try-catch, add asyncHandler ✅
```

---

## Error Type Reference

```
Error Thrown in Handler
    │
    ▼
asyncHandler Catches
    │
    ├─ Logs error with context
    │  └─ Method: GET/POST/PUT/DELETE
    │  └─ Path: /api/endpoint
    │  └─ Stack trace
    │
    └─ Passes to next(error)
       │
       ▼
    Global Error Handler
       │
       ├─ Extract statusCode (from err.statusCode)
       │
       ├─ Get message (from err.message)
       │
       ├─ If err.statusCode doesn't exist → 500
       │
       └─ Send JSON:
          {
            "success": false,
            "message": "error message",
            "stack": "..." (dev mode only)
          }
```

---

## Status Code Reference

```
Custom Error Classes
│
├─ BadRequestError(400)
│  └─ throw new BadRequestError('Email required')
│
├─ UnauthorizedError(401)
│  └─ throw new UnauthorizedError('Invalid credentials')
│
├─ ForbiddenError(403)
│  └─ throw new ForbiddenError('Access denied')
│
├─ NotFoundError(404)
│  └─ throw new NotFoundError('User not found')
│
├─ ConflictError(409)
│  └─ throw new ConflictError('User already exists')
│
└─ InternalServerError(500)
   └─ Thrown by database/service errors
```

---

## Response Format Comparison

### Success Response

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {
    /* payload */
  }
}
```

### Error Response (Production)

```json
{
  "success": false,
  "message": "Descriptive error message",
  "statusCode": 400
}
```

### Error Response (Development)

```json
{
  "success": false,
  "message": "Descriptive error message",
  "statusCode": 400,
  "stack": "Error: Descriptive error message\n    at function (/path/to/file.ts:123:456)"
}
```

---

## Complete Route Example

```typescript
import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";
import { successResponse } from "../utils/response";
import { UserRole } from "../constants/enums";
import { NotFoundError, BadRequestError } from "../utils/errors";

const router = express.Router();

// ✅ PATTERN: Protected route with asyncHandler
router.get(
  "/:id",
  authMiddleware, // 1. Verify JWT
  authorize(UserRole.ADMIN), // 2. Check role
  asyncHandler(async (req: Request, res: Response) => {
    // 3. asyncHandler wraps handler

    const userId = req.params.id;

    // Validation (thrown error = caught by asyncHandler)
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    // Database query (error = caught by asyncHandler)
    const user = await UserService.getUserById(userId);

    // Check result (thrown error = caught by asyncHandler)
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Send response
    successResponse(res, "User retrieved", user);
  })
);

export default router;
```

**Flow when request arrives:**

1. ✅ authMiddleware checks JWT
2. ✅ authorize checks if user is ADMIN
3. ✅ asyncHandler starts
4. ✅ Extract userId from params
5. ✅ Validate userId
6. ✅ Query database via UserService
7. ✅ Check if user exists
8. ✅ Send success response
9. ✅ If ANY error thrown at step 5-7, asyncHandler catches it and sends error response

---

## Logging Output Example

### Successful Request

```
GET /api/users/123 - 200 OK (45ms)
```

### Failed Request (caught by asyncHandler)

```
GET /api/users/123 - 404 Not Found (12ms)
Async handler error: NotFoundError: User not found
  at getUserById (src/services/user.service.ts:45:12)
  at GET /api/users/:id (src/routes/user.routes.ts:15:8)
```

---

## Implementation Checklist for New Route

- [ ] Import asyncHandler: `import { asyncHandler } from '../middleware/async-handler.middleware';`
- [ ] Import error classes: `import { BadRequestError, NotFoundError } from '../utils/errors';`
- [ ] Import response utility: `import { successResponse } from '../utils/response';`
- [ ] Wrap handler: `asyncHandler(async (req, res) => { ... })`
- [ ] Add auth middleware if needed: `authMiddleware,`
- [ ] Add rate limiter if needed: `rateLimiter,`
- [ ] Throw errors instead of returning: `throw new BadRequestError('...')`
- [ ] Use response utility: `successResponse(res, 'message', data)`
- [ ] Test successful scenario
- [ ] Test error scenario (missing required field)
- [ ] Check error response format
- [ ] Verify error is logged in console

---

## Common Mistakes to Avoid

❌ **Mistake 1**: Using try-catch with asyncHandler

```typescript
router.post(
  "/endpoint",
  asyncHandler(async (req, res) => {
    try {
      // code
    } catch (error) {
      next(error); // ← Unnecessary! asyncHandler already does this
    }
  })
);
```

✅ **Fix**: Remove try-catch, let asyncHandler handle it

```typescript
router.post(
  "/endpoint",
  asyncHandler(async (req, res) => {
    // code - errors automatically caught
  })
);
```

---

❌ **Mistake 2**: Mixing response methods

```typescript
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    // Some responses use successResponse()
    if (!users) {
      return res.status(404).json({ error: "Not found" }); // ← Inconsistent format
    }
    successResponse(res, "Success", users); // ← Consistent format
  })
);
```

✅ **Fix**: Use response utilities everywhere

```typescript
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.findMany();
    if (!users?.length) {
      throw new NotFoundError("No users found");
    }
    successResponse(res, "Users retrieved", users);
  })
);
```

---

❌ **Mistake 3**: Forgetting to add async keyword

```typescript
router.post(
  "/data",
  asyncHandler((req, res) => {
    // ← Missing async
    const result = await DataService.fetch(); // ← Error! await without async
    res.json(result);
  })
);
```

✅ **Fix**: Always add async to handler function

```typescript
router.post(
  "/data",
  asyncHandler(async (req, res) => {
    // ← async added
    const result = await DataService.fetch();
    res.json(result);
  })
);
```

---

## Summary

### Key Takeaways

1. ✅ All async handlers MUST use asyncHandler
2. ✅ Errors are automatically caught and passed to error handler
3. ✅ Throw errors instead of returning error responses
4. ✅ Use response utilities for consistency
5. ✅ No try-catch needed (asyncHandler handles it)
6. ✅ Middleware chain works normally before asyncHandler

### Quick Start

```typescript
// Copy this template
router.post(
  "/endpoint",
  asyncHandler(async (req, res) => {
    // Your code here
    // Errors automatically caught!
  })
);
```

### Files to Reference

- Middleware: `src/middleware/async-handler.middleware.ts`
- Guide: `ASYNC_HANDLER.md`
- Audit: `ASYNCHANDLER_AUDIT.md`
- Implementation: `ASYNCHANDLER_IMPLEMENTATION.md`
- This file: `ASYNCHANDLER_VISUAL_GUIDE.md`
