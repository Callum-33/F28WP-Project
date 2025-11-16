# F28WP Project - Dockerized AirBnB Clone

A full-stack property rental platform built with MySQL, Express.js, React, and Node.js, orchestrated with Docker. This project implements a complete AirBnB-style booking system with custom token-based authentication.

## 🎯 Project Overview

This is a **university project for F28WP Web Programming** that implements a complete rental marketplace where users can list properties, search listings, make bookings, and leave reviews. The application features separate interfaces for renters and property owners (listers).

### Tech Stack

- **Frontend**: React 18 + Vite (port 5173)
- **Backend**: Express.js + Node.js (port 3000)
- **Database**: MySQL 8.0 (port 3306)
- **Containerization**: Docker + Docker Compose
- **Authentication**: Custom token-based session system (24-hour expiry)

## ✨ Features

### For Renters
- ✅ Create, login, and delete account
- ✅ Search and filter listings by location and price
- ✅ Book properties with date selection
- ✅ View and manage bookings
- ✅ Modify pending bookings (change dates)
- ✅ Cancel pending bookings
- ✅ Leave reviews for approved bookings

### For Listers (Property Owners)
- ✅ Create, login, and delete account
- ✅ Post new listings with images (4-step wizard)
- ✅ Edit existing listings
- ✅ Delete listings
- ✅ View booking requests for properties
- ✅ Approve or deny booking requests
- ✅ View complete booking history

### Additional Features
- Real-time property image uploads
- Google Maps integration for property locations
- Responsive UI with tabbed navigation
- Average rating display per property
- Session management with automatic cleanup

## 📋 Prerequisites

- **Docker Desktop** (includes Docker Compose)
- **Git** for version control
- **Web browser** (Chrome, Firefox, Safari, etc.)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Nhogg/F28WP-Project.git
cd F28WP-Project
```

### 2. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

**Default configuration works out of the box** - no need to edit `.env` for development.

### 3. Start the application

Build and start all containers:

```bash
docker-compose up --build
```

**First-time startup**: This will:
- Build the backend and frontend Docker images (~2-3 minutes)
- Start MySQL container and **automatically initialize the database schema** from `database/schema.sql`
- Start the Express.js backend server
- Start the Vite development server

**Subsequent startups**: Use `docker-compose up` (no rebuild needed).

> **✨ Zero Database Setup Required**: The MySQL container automatically executes `database/schema.sql` on first run via Docker's `/docker-entrypoint-initdb.d/` mechanism. This means every team member gets an identical database schema with zero manual setup!

### 4. Load mock data (optional but recommended)

After the containers are running, load sample listings and users in a new terminal:

```bash
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals < database/insert_mock_data.sql
```

**Note**: Mock users have placeholder passwords - they won't work for login. Create real accounts via the UI Register button to test authentication.

> **💡 Pro Tip**: Mock data is optional but helpful for testing search/filter functionality without manually creating listings.

### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MySQL**: `localhost:3306` (credentials in docker-compose.yml)

## 🏗️ Architecture

### System Design

```
┌─────────────┐      HTTP/REST      ┌─────────────┐      SQL Queries      ┌─────────────┐
│   React     │ ←─────────────────→ │  Express.js │ ←──────────────────→ │    MySQL    │
│   Frontend  │      Axios API      │   Backend   │    mysql2/promise    │   Database  │
│  (Port 5173)│                     │  (Port 3000)│                      │  (Port 3306)│
└─────────────┘                     └─────────────┘                      └─────────────┘
       │                                   │                                     │
       │                                   │                                     │
   Vite Dev Server              Token-based Auth                        7 Core Tables
   React Router                 Express Routes                          CASCADE Deletes
```

### Database Schema

**7 Core Tables** with relational integrity:

1. **Users**: Authentication (passwordHash + salt), role (user/admin), profile info
2. **Properties**: Listings with owner relationship, pricing, location
3. **Bookings**: Reservations linking Properties + Users, status (Pending/Approved/Denied)
4. **Reviews**: Ratings (1-5 stars) + comments for properties
5. **PropertyImages**: Multiple images per property with primary flag
6. **Sessions**: Token storage for authentication (24-hour expiry)
7. **Favorites**: (Schema present but not yet implemented in UI)

**Key relationships**:
- User deletion cascades to all properties, bookings, reviews, sessions
- Property deletion cascades to bookings, reviews, images
- Foreign keys enforce referential integrity

### Authentication Flow

1. User registers → `POST /api/users/register` → HMAC-SHA256 hash stored
2. User logs in → `POST /api/login` → Session token generated (24hr expiry)
3. Token stored in localStorage → Axios interceptor adds `Authorization: Bearer <token>` header
4. Backend validates token via `authMiddleware.js` → Joins Sessions + Users tables
5. Protected routes require valid token → User data available in `req.user`

**No JWT used** - custom token system with MySQL session storage.

## 📁 Project Structure

```
F28WP-Project/
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js       # Token validation middleware
│   ├── routes/
│   │   ├── authRoutes.js           # /api/login, /api/users/* (register, delete)
│   │   ├── listingRoutes.js        # /api/listings/* (CRUD, search, images)
│   │   └── bookingRoutes.js        # /api/bookings/* (create, approve, deny, review)
│   ├── utils/
│   │   ├── cryptoUtils.js          # Password hashing (HMAC-SHA256)
│   │   └── dbConnection.js         # MySQL connection pool
│   ├── uploads/properties/         # Uploaded images (volume mount)
│   ├── server.js                   # Express app entry point
│   ├── Dockerfile                  # Backend container config
│   └── package.json                # Dependencies: express, mysql2, cors, multer
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx       # Login/Register modal
│   │   │   ├── AccountManagement.jsx  # User account settings
│   │   │   ├── Card.jsx            # Listing card component
│   │   │   ├── ListingGrid.jsx     # Grid layout for listings
│   │   │   ├── ListingDetailPanel.jsx  # Property details sidebar
│   │   │   ├── BookingModal.jsx    # Date picker + booking form
│   │   │   └── Navigate.jsx        # Navigation bar
│   │   ├── routes/
│   │   │   ├── RentPage.jsx        # Browse/search listings
│   │   │   ├── SellPage.jsx        # Post new listing (4 steps)
│   │   │   ├── MyRentalsPage.jsx   # Bookings + listings management
│   │   │   └── PropertyDetailPage.jsx  # (Reserved for future use)
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state (useAuth hook)
│   │   ├── utils/
│   │   │   └── api.js              # Axios instance + interceptors
│   │   ├── App.jsx                 # React Router + routes
│   │   └── main.jsx                # App entry point
│   ├── Dockerfile                  # Frontend container config
│   ├── vite.config.js              # Vite dev server config
│   └── package.json                # Dependencies: react, react-router, axios
├── database/
│   ├── schema.sql                  # CREATE TABLE statements (auto-loaded)
│   ├── insert_mock_data.sql        # Sample data (manual load)
│   └── queries.sql                 # Reference queries
├── docker-compose.yml              # Multi-container orchestration
└── API_AUTH_REFERENCE.md           # API endpoint documentation
```

## 🛠️ Development Workflow

### Common Commands

```bash
# Start all services
docker-compose up

# Start with rebuild (after package.json changes)
docker-compose up --build

# Stop all services
docker-compose down

# Stop and wipe database (fresh start)
docker-compose down -v

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Execute commands in running containers
docker-compose exec backend npm install <package>
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals
```

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Vite watches `frontend/src/` - changes reflect instantly
- **Backend**: Nodemon watches `backend/` - server restarts on file changes
- **Database**: Schema changes require `docker-compose down -v && docker-compose up --build`

### Making Changes

#### Adding a new API endpoint

1. Add route handler in `backend/routes/*.js`
2. Import and mount route in `backend/server.js` via `app.use()`
3. Add API function to `frontend/src/utils/api.js`
4. Protected route? Add `authenticateToken` middleware

#### Adding a new React page

1. Create component in `frontend/src/routes/`
2. Add `<Route>` to `frontend/src/App.jsx`
3. Add navigation link in `frontend/src/components/Navigate.jsx`

#### Modifying database schema

1. Edit `database/schema.sql`
2. Wipe database and rebuild: `docker-compose down -v && docker-compose up --build`
3. Reload mock data if needed: `docker-compose exec mysql mysql -u rentals_user -prentals_password rentals < database/insert_mock_data.sql`

**How auto-initialization works**: The `schema.sql` file is mounted to `/docker-entrypoint-initdb.d/` in the MySQL container. Docker automatically executes any `.sql` files in this directory when creating a new database volume. This is a standard MySQL Docker feature.

### Accessing MySQL CLI

```bash
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals
```

Example queries:
```sql
-- View all users
SELECT userID, username, email, role FROM Users;

-- View all bookings with property names
SELECT b.*, p.propertyName, u.username 
FROM Bookings b 
JOIN Properties p ON b.propertyID = p.propertyID 
JOIN Users u ON b.renterID = u.userID;

-- Check active sessions
SELECT s.sessionToken, u.username, s.expiry 
FROM Sessions s 
JOIN Users u ON s.userID = u.userID 
WHERE s.expiry > NOW();
```

## 🔌 API Reference

### Authentication Endpoints

```bash
# Register new user
POST /api/users/register
Body: { username, password, role?, email?, firstName?, lastName? }

# Login
POST /api/login
Body: { username, password }
Response: { token, user }

# Logout (requires auth)
POST /api/logout
Headers: Authorization: Bearer <token>

# Delete account (requires auth)
DELETE /api/users/:id
Headers: Authorization: Bearer <token>
```

### Listing Endpoints

```bash
# Get all listings (with search/filter)
GET /api/listings?location=<search>&maxPrice=<number>

# Create listing (requires auth)
POST /api/listings
Body: { listerId, title, description, price, location, images[] }

# Update listing (requires auth, owner only)
PUT /api/listings/:id
Body: { title?, description?, price?, address?, rooms? }

# Delete listing (requires auth, owner only)
DELETE /api/listings/:id

# Get user's listings (requires auth)
GET /api/users/:listerId/listings

# Get listing reviews
GET /api/listings/:id/reviews

# Get listing images
GET /api/listings/:id/images
```

### Booking Endpoints

```bash
# Get user's bookings (requires auth)
GET /api/bookings/users/:userID

# Get bookings for user's properties (requires auth)
GET /api/bookings/owner/:userID

# Create booking (requires auth)
POST /api/bookings
Body: { propertyID, renterID, startDate, endDate }

# Update booking dates (requires auth, renter only, pending only)
PUT /api/bookings/:bookingID
Body: { startDate, endDate }

# Cancel booking (requires auth, renter only, pending only)
DELETE /api/bookings/:bookingID

# Approve booking (requires auth, owner only)
PUT /api/bookings/:bookingID/approve

# Deny booking (requires auth, owner only)
PUT /api/bookings/:bookingID/deny

# Leave review (requires auth, renter only, approved bookings)
POST /api/bookings/:bookingID/review
Body: { rating, comment? }
```

See `API_AUTH_REFERENCE.md` for detailed curl examples.

## 🌍 Environment Variables

### Backend (docker-compose.yml)

- `DB_HOST=mysql` - MySQL container hostname (DO NOT use "localhost")
- `DB_USER=rentals_user` - Database username
- `DB_PASSWORD=rentals_password` - Database password
- `DB_NAME=rentals` - Database name
- `PORT=3000` - Express server port

### Frontend (.env)

- `VITE_API_URL=http://localhost:3000` - Backend API base URL
- `VITE_MAPS_API_KEY=<your_key>` - Google Maps API key (optional)

**Note**: Vite exposes env vars as `import.meta.env.VITE_*`

## 📦 What's Tracked in Git

### Included (committed to repository)
- ✅ Source code (`backend/`, `frontend/src/`)
- ✅ Configuration files (`docker-compose.yml`, `package.json`, `.env.example`)
- ✅ Database schema (`database/schema.sql`)
- ✅ Mock data SQL (`database/insert_mock_data.sql`)
- ✅ Documentation (`README.md`, `API_AUTH_REFERENCE.md`)
- ✅ Directory structure (`.gitkeep` files)

### Ignored (not committed)
- ❌ `node_modules/` - Installed by npm in containers
- ❌ `.env` - Local environment variables (use `.env.example` as template)
- ❌ `backend/uploads/properties/*.png` - User-uploaded images
- ❌ `mysql_data/` - Docker volume data (database contents)
- ❌ `dist/`, `build/` - Production builds
- ❌ IDE configs (`.vscode/`, `.idea/`)
- ❌ OS files (`.DS_Store`, `Thumbs.db`)

**Why ignore uploads and database data?**
- Each developer's database will have different test data
- Uploaded images are user-generated content, not source code
- MySQL volume is automatically created fresh on each machine
- Schema is tracked (`.sql` files), not the actual data

This ensures clean Git history and prevents merge conflicts from binary files or database inconsistencies.

## 🐛 Troubleshooting

### Port conflicts

If you see "port already in use" errors:
1. Stop conflicting services (check with `lsof -i :3000` or `netstat -an | grep 3000`)
2. Or change port mappings in `docker-compose.yml`

### Database connection errors

Check container status:
```bash
docker-compose ps
```

All containers should show "Up" status. If MySQL is unhealthy:
```bash
docker-compose logs mysql
docker-compose restart mysql
```

### Frontend can't connect to backend

1. Verify `VITE_API_URL` in `.env` (should be `http://localhost:3000`)
2. Check backend is running: `curl http://localhost:3000/api/listings`
3. Check browser console for CORS errors

### Authentication issues

1. Clear localStorage: Open browser console → `localStorage.clear()`
2. Check token expiry: Login tokens expire after 24 hours
3. Verify token in request: Check Network tab → Headers → Authorization

### "Cannot read property of undefined" errors

This usually means:
1. User not authenticated (check `isAuthenticated` in AuthContext)
2. Database query returned no results (check MySQL data)
3. Missing environment variables (restart containers after .env changes)

## 🧪 Testing

**Manual testing recommended** for this university project:

1. **Create account** → Register with username/password
2. **Post listing** → Navigate to "Sell" → Complete 4-step wizard
3. **Search listings** → Go to "Rent" → Try location/price filters
4. **Book property** → Click listing → Click "Book Now" → Select dates
5. **Approve booking** → Login as lister → Go to "My Rentals" → "Booking Requests" tab → Click "Approve"
6. **Leave review** → Login as renter → Go to "My Rentals" → "My Bookings" tab → Click "Leave Review" on approved booking
7. **Edit listing** → Go to "My Rentals" → "Your Listings" tab → Click "Edit"
8. **Delete account** → Click profile icon → "Delete Account"

## 📝 Design Decisions

### Why MySQL instead of PostgreSQL?

Despite the README history mentioning PostgreSQL, we chose MySQL because:
- Wider industry adoption in web hosting environments
- Simpler setup for student projects
- Better Docker Hub image stability
- Team familiarity with MySQL syntax

### Why custom token auth instead of JWT?

- **Learning objective**: Understand session management from scratch
- **Simplicity**: No external libraries needed, easy to debug
- **Database-backed**: Session revocation works immediately (logout = delete token)
- **Good enough for demo**: 24-hour expiry sufficient for coursework

### Why no validation library?

- **University project constraint**: Keep code simple and readable
- **Manual checks are clear**: Easy to see what's being validated
- **Reduces dependencies**: Fewer packages to install and manage
- **Sufficient for demo**: Basic validation covers all use cases

### Why cascade deletes?

- **Referential integrity**: Prevents orphaned data
- **Simplifies code**: No need to manually delete related records
- **Demo-friendly**: Quick cleanup when testing
- **Real-world pattern**: Common in many production systems

## 👥 Contributing

This is a university group project. For group members:

1. **Pull latest changes** before starting work: `git pull origin main`
2. **Create feature branches**: `git checkout -b feature/your-feature-name`
3. **Test locally** with `docker-compose up` before pushing
4. **Commit frequently** with clear messages
5. **Push to GitHub** and create pull requests for review

## 📄 License

This project is for educational purposes as part of the F28WP Web Programming course.

## 🙏 Acknowledgments

- F28WP course instructors and teaching assistants
- Docker and Docker Compose documentation
- React and Vite communities
- Stack Overflow for debugging help

---

**Current Status**: ✅ All functional requirements implemented and tested
**Last Updated**: November 2025
