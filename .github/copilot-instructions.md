# F28WP Project - AI Coding Agent Instructions

## Architecture Overview

This is a **Dockerized PERN-stack AirBnB clone** with a MySQL backend (note: README incorrectly says PostgreSQL). Three containers orchestrated via `docker-compose.yml`:

- **MySQL** (port 3306): Relational database with schema in `database/schema.sql`
- **Backend** (port 3000): Express.js REST API with session-based auth
- **Frontend** (port 5173): React + Vite SPA with React Router

### Key Design Decisions

**Authentication**: Custom token-based auth (NOT JWT). Sessions stored in MySQL `Sessions` table with 24hr expiry. Token validation via `authMiddleware.js` joins Sessions+Users tables. Bearer tokens required in `Authorization` header for protected routes.

**Database Schema**: Seven core tables with CASCADE deletes:
- `Users` (with both `passwordHash`/`salt` AND legacy `pass` field)
- `Properties` (owned by Users via `ownerID`)
- `Bookings` (links Properties+Users, status: Pending/Approved/Denied)
- `Reviews`, `PropertyImages`, `Sessions`

**Data Flow**: Frontend calls axios API client (`frontend/src/utils/api.js`) → Express routes → MySQL via `mysql2/promise` connection pool → JSON responses. No ORM used.

## Critical Developer Workflows

### Starting the Stack
```bash
docker-compose up --build  # Initial build and start
docker-compose up          # Subsequent starts
docker-compose down -v     # Stop and wipe database
```

**Container commands** (from project root):
```bash
# Install new npm package in backend
docker-compose exec backend npm install <package>

# Connect to MySQL CLI
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals

# Run mock data script
docker-compose exec mysql mysql -u rentals_user -prentals_password rentals < database/insert_mock_data.sql

# Check logs
docker-compose logs -f backend
```

### Database Initialization

Schema auto-loads from `database/schema.sql` via docker-compose volume mount. Mock data in `database/insert_mock_data.sql` must be loaded manually (see above). Mock users have placeholder hashes - use `/api/users/register` to create real users.

### Environment Setup

Copy `.env.example` → `.env`. Frontend needs `VITE_API_URL` (default: `http://localhost:3000`). Backend uses `DB_HOST=mysql` (container name, not localhost). See `docker-compose.yml` for MySQL credentials.

## Project-Specific Conventions

### Backend API Patterns

**Route organization**: All routes in `backend/routes/*.js`, mounted in `server.js`:
```javascript
app.use('/api', authRoutes);        // /api/login, /api/users/*
app.use('/api', listingRoutes);     // /api/listings/*
app.use('/api/bookings', bookingRoutes);  // /api/bookings/*
```

**Database queries**: Use `mysql2/promise` pool from `dbConnection.js`:
```javascript
const [rows] = await pool.query('SELECT * FROM Users WHERE userID = ?', [userId]);
// Note: mysql2 returns [resultRows, fieldInfo] tuple - destructure first element
```

**Response format**: Endpoints return `{ message: string, data?: any }` on success, `{ message: string }` or `{ error: string }` on failure. Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error.

**Protected routes**: Add `authenticateToken` middleware to require auth. User data available in `req.user` (id, username, role, email, firstName, lastName).

### Frontend Patterns

**API calls**: Import `api` or specific functions from `utils/api.js`:
```javascript
import { api } from '../utils/api';
const response = await api.get('/api/listings');  // Auth token auto-injected
```

**Authentication**: Use `AuthContext` (`context/AuthContext.jsx`) via `useAuth()` hook:
```javascript
const { user, token, isAuthenticated, login, logout } = useAuth();
// user/token persisted to localStorage
```

**Routing**: React Router in `App.jsx`. Pages in `src/routes/`, components in `src/components/`. Navigate via `<Link>` or `useNavigate()`.

**Component structure**: Functional components with hooks. CSS modules pattern: `Component.jsx` + `Component.css` in same directory.

### Data Model Quirks

**Column naming**: Database uses snake_case (e.g., `propertyID`, `pricePerNight`) - maintain this in queries. Frontend transforms to camelCase where needed.

**Listings vs Properties**: Frontend calls them "listings", database table is `Properties`. Code uses both terms interchangeably.

**Booking status**: MySQL ENUM with capital first letter: `'Pending'`, `'Approved'`, `'Denied'` (not lowercase).

**Password fields**: Users table has BOTH `passwordHash`/`salt` (used by `cryptoUtils.js` HMAC-SHA256) AND legacy `pass` field (unused). New users only populate hash/salt.

## Integration Points

### Frontend ↔ Backend
- **Base URL**: `VITE_API_URL` env var (Vite exposes as `import.meta.env.VITE_API_URL`)
- **CORS**: Backend allows frontend origin via `cors` middleware
- **Auth flow**: Login → store token in localStorage → axios interceptor adds `Authorization: Bearer <token>` header

### Backend ↔ Database
- **Connection**: Singleton pool in `utils/dbConnection.js`, imported in routes
- **Migrations**: None - schema in `schema.sql`, loaded on container init
- **Seeding**: Manual via `insert_mock_data.sql`

### External Services
- **Google Maps**: Embedded in `ListingDetailPanel.jsx` via `VITE_MAPS_API_KEY` env var
- **Images**: Unsplash URLs in `PropertyImages.imagePath` (mock data only)

## Common Pitfalls

1. **Don't use `localhost` for DB_HOST** in backend - use `mysql` (Docker service name)
2. **README is outdated** - says PostgreSQL but project uses MySQL
3. **Token expiry not enforced** - `authenticateToken` checks `expiry > NOW()` but no cleanup job exists (this is fine for demo)
4. **Cascade deletes** - Deleting user deletes all their properties/bookings/reviews (intentional for simplicity)
5. **No validation library** - Manual field checks in routes (intentional - keep it simple)
6. **Mixed error response keys** - Some routes return `{ error }`, others `{ message }` on errors (doesn't matter for demo)
7. **No comprehensive error handling** - Basic try-catch is sufficient for this project

## Testing & Debugging

**No automated tests** - Manual testing via Postman/curl or frontend is sufficient for this project.

**API reference**: See `API_AUTH_REFERENCE.md` for endpoint examples with curl commands.

**Hot reload**: Both frontend and backend have nodemon/Vite watch mode in Docker. Changes reflected without rebuild (except package.json changes).

**Debugging backend**: `docker-compose logs -f backend` for errors. Keep console.error statements simple.

## Adding Features

### New API endpoint:
1. Add route in `backend/routes/*.js`
2. Import route in `server.js` and mount with `app.use()`
3. Add function to `frontend/src/utils/api.js`
4. Protected? Add `authenticateToken` middleware

### New database table:
1. Add `CREATE TABLE` to `database/schema.sql`
2. Update `insert_mock_data.sql` if mock data needed
3. Rebuild containers: `docker-compose down -v && docker-compose up --build`

### New React page:
1. Create in `frontend/src/routes/`
2. Add `<Route>` to `App.jsx`
3. Add navigation link in `Navigate.jsx`

## University Project Constraints

**CRITICAL**: This is a student project for **F28WP Web Programming** that will be graded and demoed. Code must be:

1. **Simple & Readable**: Write code a human would write - no over-engineering, no abstractions unless necessary
2. **Minimal & Focused**: Only implement what's explicitly requested - no "nice to have" features or defensive coding bloat
3. **Design-Driven**: Follow the Figma designs exactly - don't add UI enhancements or extra components
4. **Demo-Ready**: Code will be shown in a video demo and submitted for grading - prioritize clarity over production patterns
5. **No Production Concerns**: Don't add logging frameworks, monitoring, advanced error handling, rate limiting, etc.

### What NOT to Add
- ❌ Complex validation libraries (manual checks are fine)
- ❌ Advanced error handling beyond basic try-catch
- ❌ Logging frameworks or analytics
- ❌ Performance optimizations unless bottleneck exists
- ❌ Extra UI components not in Figma
- ❌ Features "for later" or "best practices" that aren't requested
- ❌ Tests (unless explicitly asked)

### Code Style
- Keep functions short and single-purpose
- Use clear variable names (`userId` not `uid`)
- Avoid clever tricks - write obvious code
- Comments only for non-obvious business logic
- No premature abstraction - duplicate code is OK if it's clearer
