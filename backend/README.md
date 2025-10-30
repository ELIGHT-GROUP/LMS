# LMS Backend - TypeScript Template

A professional, production-ready LMS (Learning Management System) backend built with **Express.js**, **TypeScript**, and **Sequelize ORM**.

## 📋 Features

- ✅ **TypeScript** - Full type safety and modern development experience
- ✅ **Express.js** - Lightweight and flexible web framework
- ✅ **Sequelize ORM** - Database agnostic ORM with support for PostgreSQL & MongoDB
- ✅ **Authentication** - JWT-based authentication with token management
- ✅ **Security** - Helmet, CORS, rate limiting, and compression middleware
- ✅ **Validation** - Input validation and error handling
- ✅ **Logging** - Structured logging with Winston
- ✅ **Error Handling** - Centralized error management with custom error classes
- ✅ **Storage** - Multi-provider file upload (Cloudinary, AWS S3)
- ✅ **Environment Configuration** - Flexible env-based configuration
- ✅ **ESLint & Prettier** - Code linting and formatting
- ✅ **Docker Ready** - Containerization support

## 🏗️ Project Architecture

```
src/
├── config/          # Configuration files (database, storage, env)
├── constants/       # Enums and constants
├── controllers/     # HTTP request handlers
├── middleware/      # Express middleware
├── models/          # Sequelize models
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript interfaces and types
├── utils/           # Utility functions (logger, JWT, errors, etc.)
├── app.ts           # Express app configuration
└── index.ts         # Server entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ or 18+
- npm or pnpm
- PostgreSQL 12+ (or MongoDB if using MongoDB database)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd lms-backend-ts
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create database**

```bash
npm run db:create
```

5. **Run migrations**

```bash
npm run db:migrate
```

## 📝 Environment Configuration

Create a `.env` file in the root directory. See `.env.example` for reference:

```env
# Application
PORT=8080
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Database
DATABASE_TYPE=postgres
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASS=password
PG_DB=lms_db

# Storage
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server

# Database
npm run db:migrate          # Run database migrations
npm run db:migrate:undo     # Undo last migration
npm run db:seed:all         # Seed database
npm run db:create           # Create database

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 📚 API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/signup
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password",
  "phone_number": "+1234567890",
  "country_code": "US",
  "dial_code": "+1",
  "role": "STUDENT"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "password": "secure-password"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

#### Get Auth Data

```http
GET /api/auth/auth-data?userId=uuid
Authorization: Bearer <token>
```

#### Request OTP

```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phone_number": "+1234567890"
}
```

#### Verify Mobile

```http
POST /api/auth/verify-mobile
Content-Type: application/json

{
  "userId": "uuid",
  "code": "123456"
}
```

#### Reset Password

```http
POST /api/auth/reset-password-request
Content-Type: application/json

{
  "phone_number": "+1234567890"
}
```

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "userId": "uuid",
  "newPassword": "new-secure-password"
}
```

### Health Check

```http
GET /health-check
```

## 🔐 Authentication & Authorization

The system uses JWT-based authentication:

1. User logs in → Receives JWT token
2. Token is stored in database and marked as active
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend validates token and user permissions
5. Token can be revoked by marking as inactive in database

### Protected Routes

Use `authMiddleware` to protect routes:

```typescript
router.get("/protected", authMiddleware, authorize(UserRole.ADMIN), controller.method);
```

## 📦 Database Models

### User

- id (UUID)
- full_name (String)
- email (String, unique)
- phone_number (String, unique)
- password (String, hashed)
- role (ENUM: ADMIN, TEACHER, STUDENT, CLIENT)
- is_active (Boolean)
- is_account_verified (Boolean)
- timestamps

### Token

- id (UUID)
- user_id (FK)
- token (String)
- expire_at (Date)
- is_active (Boolean)
- timestamps

## 🛡️ Security Features

- **Helmet.js** - Sets secure HTTP headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **JWT** - Secure token-based authentication
- **Password Hashing** - bcryptjs for password encryption
- **Input Validation** - Request body validation
- **Error Handling** - No sensitive info in error messages

## 📊 Error Handling

The system uses custom error classes:

```typescript
throw new BadRequestError("Invalid input"); // 400
throw new UnauthorizedError("Invalid token"); // 401
throw new ForbiddenError("Access denied"); // 403
throw new NotFoundError("Resource not found"); // 404
throw new InternalServerError("Server error"); // 500
```

## 🔄 Middleware

- **Authentication** - JWT verification
- **CORS** - Cross-origin requests
- **Helmet** - Security headers
- **Compression** - Response compression
- **Rate Limiting** - Request throttling
- **Request Logger** - HTTP request logging
- **Error Handler** - Global error handling

## 📝 Type Definitions

All major types are defined in `src/types/index.ts`:

```typescript
interface IAuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
```

## 🗄️ Database Migrations

Create a new migration:

```bash
npm run sequelize-cli migration:create --name create-table-name
```

Run migrations:

```bash
npm run db:migrate
```

Undo migrations:

```bash
npm run db:migrate:undo
```

## 📚 API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

## 🐳 Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8080
CMD ["npm", "start"]
```

## 📖 Code Standards

- **TypeScript Strict Mode** - Full type checking enabled
- **ESLint** - Code linting rules enforced
- **Prettier** - Consistent code formatting
- **Structured Logging** - Winston-based logging
- **Error Classes** - Custom error handling
- **Service Layer** - Business logic separation

## 🔗 Useful Links

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Sequelize Documentation](https://sequelize.org/)
- [JWT.io](https://jwt.io/)
- [Helmet Documentation](https://helmetjs.github.io/)

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please follow the code standards and submit pull requests.

## 🤝 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ using TypeScript and Express.js**
