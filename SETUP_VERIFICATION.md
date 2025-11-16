# Setup Verification Checklist

Use this guide to verify your local development environment is working correctly.

## ✅ Pre-Setup Checklist

Before running the project, ensure you have:

- [ ] Docker Desktop installed and running
- [ ] Git installed
- [ ] Repository cloned: `git clone https://github.com/Nhogg/F28WP-Project.git`
- [ ] Changed to project directory: `cd F28WP-Project`
- [ ] Created `.env` file: `cp .env.example .env` (or just start without it - defaults work!)

## 🚀 First-Time Setup

Run these commands in order:

```bash
# 1. Start all containers (this will take 2-3 minutes on first run)
docker-compose up --build

# Wait for these messages:
# ✓ MySQL: "ready for connections" 
# ✓ Backend: "Server is running on port 3000"
# ✓ Frontend: "Local: http://localhost:5173"
```

**In a new terminal** (keep the first one running):

```bash
# 2. Load mock data (optional but recommended)
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals < database/insert_mock_data.sql

# You should see: "Query OK, X rows affected" messages
```

## 🧪 Verification Tests

### 1. Check Container Status

```bash
docker-compose ps
```

**Expected output**: All 3 containers should show "Up" status:
```
NAME              STATUS        PORTS
f28wp-mysql       Up (healthy)  0.0.0.0:3306->3306/tcp
f28wp-backend     Up            0.0.0.0:3000->3000/tcp
f28wp-frontend    Up            0.0.0.0:5173->5173/tcp
```

### 2. Test Frontend Access

Open browser to: http://localhost:5173

**Expected**: You should see the rental homepage with navigation bar

### 3. Test Backend API

```bash
curl http://localhost:3000/api/listings
```

**Expected**: JSON array of listings (empty `[]` if no mock data, or list of properties)

### 4. Verify Database Schema

```bash
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals -e "SHOW TABLES;"
```

**Expected output**:
```
+-------------------+
| Tables_in_rentals |
+-------------------+
| Bookings          |
| Properties        |
| PropertyImages    |
| Reviews           |
| Sessions          |
| Users             |
+-------------------+
```

If you see these 6 tables (or 7 including Favorites), **schema auto-initialization worked!** ✅

### 5. Check Database Data

```bash
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals -e "SELECT COUNT(*) FROM Properties;"
```

**Expected**:
- `0` if no mock data loaded (this is fine)
- `8` if mock data was loaded successfully

### 6. Test User Registration

1. Go to http://localhost:5173
2. Click "Login/Sign Up" button
3. Switch to "Register" tab
4. Fill in form:
   - Username: `testuser`
   - Password: `test123`
   - Email: `test@example.com`
5. Click "Register"

**Expected**: Success message, automatically logged in

### 7. Test Listing Creation

1. While logged in, click "Sell" in navigation
2. Fill in the 4-step wizard:
   - Step 1: Property name & description
   - Step 2: Price per night & address
   - Step 3: Upload 1-3 images
   - Step 4: Review and submit
3. Click "Submit"

**Expected**: Redirected to /rent page, your listing appears in the grid

### 8. Test Booking Flow

1. Click on any listing card
2. Detail panel opens on the right
3. Click "Book Now" button
4. Select start and end dates
5. Click "Confirm Booking"

**Expected**: Success message, booking appears in "My Rentals" page

## 🔍 Database Inspection (Optional)

Connect to MySQL CLI to inspect data:

```bash
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals
```

Useful queries:
```sql
-- View all users
SELECT userID, username, email, role FROM Users;

-- View all properties
SELECT propertyID, propertyName, pricePerNight, pAddress FROM Properties;

-- View all bookings
SELECT b.bookingID, p.propertyName, u.username, b.bookingStatus 
FROM Bookings b 
JOIN Properties p ON b.propertyID = p.propertyID 
JOIN Users u ON b.renterID = u.userID;

-- Exit MySQL CLI
EXIT;
```

## 🐛 Troubleshooting

### Problem: Containers won't start

**Solution**:
```bash
# Stop everything
docker-compose down

# Remove volumes (wipes database)
docker-compose down -v

# Rebuild from scratch
docker-compose up --build
```

### Problem: Port already in use (3000, 3306, or 5173)

**Solution**: Find and stop the conflicting process

On Linux/Mac:
```bash
lsof -i :3000
lsof -i :3306
lsof -i :5173
```

Or change ports in `docker-compose.yml`

### Problem: Frontend can't connect to backend

**Check**:
1. Backend container is running: `docker-compose ps`
2. Backend logs: `docker-compose logs -f backend`
3. `.env` file has: `VITE_API_URL=http://localhost:3000`

### Problem: Database schema not created

**Check**:
```bash
# View MySQL logs
docker-compose logs mysql

# Look for this line:
# "/usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/schema.sql"
```

If missing, the schema file wasn't found. Verify:
```bash
ls -la database/schema.sql
```

**Solution**: Wipe and restart
```bash
docker-compose down -v
docker-compose up --build
```

### Problem: "Cannot read property 'id' of null" errors

**Cause**: Not logged in

**Solution**: Click "Login/Sign Up" and register a new account

### Problem: Uploaded images not displaying

**Check**:
1. Images uploaded to: `backend/uploads/properties/`
2. Backend can serve static files (check `server.js`)
3. Image URLs in database start with `/uploads/`

## ✅ Success Criteria

You're ready to develop when:

- ✅ All 3 containers are "Up"
- ✅ Frontend loads at http://localhost:5173
- ✅ Backend responds at http://localhost:3000/api/listings
- ✅ Database has 6 tables (shown in verification step 4)
- ✅ You can register, login, and create listings
- ✅ You can make and approve bookings

## 🚦 Next Steps

Once verified, you can:

1. **Develop features**: Edit code in `backend/` or `frontend/src/`
2. **Hot reload works**: Changes reflect automatically (no restart needed)
3. **View logs**: `docker-compose logs -f backend` or `frontend`
4. **Stop services**: `Ctrl+C` in the docker-compose terminal
5. **Start again**: `docker-compose up` (no build flag needed)

## 📚 Additional Resources

- Main README: See project root `README.md`
- API Documentation: See `API_AUTH_REFERENCE.md`
- Copilot Instructions: See `.github/copilot-instructions.md`

---

**Need help?** Ask in the team chat or check the Troubleshooting section above.
