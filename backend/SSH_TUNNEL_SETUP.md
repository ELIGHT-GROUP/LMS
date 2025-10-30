# SSH Tunnel Solution for Remote PostgreSQL

Your database is running on the Dokploy server, but PostgreSQL only listens on `localhost:5432` inside the container. To connect from your local machine:

## Solution: SSH Tunnel

### Step 1: Create SSH Tunnel (Keep This Running)

```bash
ssh -L 5432:localhost:5432 user@45.159.221.130
```

Replace `user` with your actual SSH username for the Dokploy server.

**What this does**:

- Forwards your local `localhost:5432` to the server's `localhost:5432`
- Keeps this terminal open (don't close it!)

### Step 2: .env Configuration (Already Updated)

Your `.env` should have:

```properties
PG_HOST=localhost
PG_DB=lms_database
PG_PASS=Viraj@2002
PG_PORT=5432
DATABASE_URL=postgresql://postgres:Viraj%402002@localhost:5432/lms_database
```

### Step 3: Run Your App

In another terminal:

```bash
npm run dev
```

---

## Alternative: Port Mapping on Docker

If you have SSH access to the server, you can permanently expose PostgreSQL:

**On the server** (via SSH):

```bash
# Edit docker-compose.yml for the PostgreSQL service
# Add ports section:
ports:
  - "5432:5432"

# Then restart the container
docker-compose restart postgres
# or
docker compose restart postgres
```

Then update `.env`:

```properties
PG_HOST=45.159.221.130
DATABASE_URL=postgresql://postgres:Viraj%402002@45.159.221.130:5432/lms_database
```

---

## Which Method to Use?

- **SSH Tunnel** (Current Setup): ✅ Works now, secure, no server changes needed
- **Port Mapping**: Requires server access, less secure (exposes DB to internet)

**Recommended**: Use SSH Tunnel (already in `.env`)

---

## Next Steps

1. Open terminal 1: Create SSH tunnel

   ```bash
   ssh -L 5432:localhost:5432 user@45.159.221.130
   ```

2. Open terminal 2: Run your app

   ```bash
   npm run dev
   ```

3. Keep terminal 1 running (the tunnel)

The app should now connect!
