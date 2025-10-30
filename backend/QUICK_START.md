# 🚀 QUICK START GUIDE - LMS Backend Setup

## ⚡ FAST TRACK (2 Options)

### Option 1: Docker Compose (EASIEST - Recommended)

```bash
# 1. Start PostgreSQL + Redis with Docker
docker-compose up -d

# 2. Run migrations (first time only)
npx prisma migrate deploy

# 3. Start dev server
npm run dev
```

**✅ This will:**

- Start PostgreSQL on localhost:5432
- Start Redis on localhost:6379
- All env vars auto-configured
- Server runs on http://localhost:8080

---

### Option 2: Manual PostgreSQL Setup (ALTERNATIVE)

#### Prerequisites

- PostgreSQL 12+ installed locally
- Running on localhost:5432

#### Setup Steps

1. **Update .env file with your PostgreSQL credentials:**

```properties
DATABASE_TYPE=postgresql
PG_USER=postgres
PG_HOST=localhost
PG_DB=lms_database
PG_PASS=your_postgres_password
PG_PORT=5432
DB_SSL=false
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/lms_database
```

2. **Create database (if not exists):**

```bash
psql -U postgres -c "CREATE DATABASE lms_database;"
```

3. **Run Prisma migrations:**

```bash
npx prisma migrate deploy
```

4. **Start dev server:**

```bash
npm run dev
```

---

## ✅ Verify Setup is Working

After running `npm run dev`, you should see:

```
✅ All environment variables validated successfully
✅ Database (Prisma) connected successfully
✅ Server listening on port 8080
```

Then test the health check:

```bash
curl http://localhost:8080/health
# Response: { "status": "healthy", "timestamp": "..." }
```

---

## 🐳 Docker Compose Commands

### Start all services

```bash
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f app
```

### Stop all services

```bash
docker-compose down
```

### Reset database (careful!)

```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate deploy
```

---

## 🔧 Common Issues & Fixes

### ❌ "Authentication failed against database server"

**Cause:** Wrong PostgreSQL credentials or database not running

**Fix:**

```bash
# Check if postgres is running
docker ps | grep postgres

# If not running, start docker-compose
docker-compose up -d postgres
```

### ❌ "Cannot find module '@prisma/client'"

**Fix:**

```bash
npm install
npx prisma generate
```

### ❌ "Port 5432 already in use"

**Fix:**

```bash
# Kill existing PostgreSQL
lsof -i :5432
kill -9 <PID>

# OR use different port in docker-compose
```

### ❌ "ENOENT: no such file or directory .env"

**Fix:**

```bash
cp .env.example .env
# Edit .env with your settings
```

---

## 📝 Environment Variables Reference

### Required for Development

```properties
PORT=8080                           # Server port
NODE_ENV=development                # Environment
DATABASE_TYPE=postgresql            # DB type
PG_USER=postgres                    # DB user
PG_HOST=localhost                   # DB host
PG_DB=lms_database                  # DB name
PG_PASS=your-password               # DB password
PG_PORT=5432                        # DB port
DB_SSL=false                        # SSL connection
JWT_SECRET=your-jwt-secret-key-here # JWT secret
ENCRYPTION_KEY=your-encryption-key  # Encryption key
CLOUDINARY_CLOUD_NAME=your-name     # Cloudinary
CLOUDINARY_API_KEY=your-key         # Cloudinary
CLOUDINARY_API_SECRET=your-secret   # Cloudinary
UPLOAD_PROVIDER=cloudinary          # Upload service
```

### Optional

```properties
REDIS_HOST=localhost
REDIS_PORT=6379
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🎯 Next Steps After Setup

1. **Run migrations:**

   ```bash
   npx prisma migrate deploy
   ```

2. **Seed database (optional):**

   ```bash
   npx prisma db seed
   ```

3. **Access Prisma Studio (to view data):**

   ```bash
   npx prisma studio
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

---

## 📱 API Testing

### Health Check

```bash
curl http://localhost:8080/health
```

### User Registration

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "password": "SecurePass123!",
    "email": "user@example.com"
  }'
```

### User Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "password": "SecurePass123!"
  }'
```

---

## 🆘 Need Help?

- Check logs: `npm run dev` (terminal output)
- Prisma docs: https://www.prisma.io/docs
- Docker help: https://docs.docker.com
- PostgreSQL setup: https://www.postgresql.org/download
