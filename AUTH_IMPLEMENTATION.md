# Authentication Implementation

## Overview
This document describes the authentication and session management system implemented for the F28WP rental property platform (Airbnb-style).

## Backend Implementation

### 1. Cryptographic Utilities (`backend/utils/cryptoUtils.js`)
- **Password Hashing**: Uses HMAC-SHA256 with random salt for secure password storage
- **Password Verification**: Timing-safe comparison to prevent timing attacks
- **Session Token Generation**: 64-character random hex tokens for sessions

### 2. Authentication Middleware (`backend/middleware/authMiddleware.js`)
- Validates Bearer tokens from Authorization header
- Checks session validity and expiration in database
- Attaches user information to request object for protected routes
- Returns 401 for invalid/expired sessions

### 3. Authentication Routes (`backend/routes/authRoutes.js`)

#### Public Endpoints:
- **POST /api/users/register** - Register new user
  - Required: `username`, `password`
  - Optional: `email`, `firstName`, `lastName`, `role`
  - Returns: User object and userId

- **POST /api/login** - User login
  - Required: `username`, `password`
  - Returns: Session token and user object
  - Token expires in 24 hours

#### Protected Endpoints:
- **POST /api/logout** - Logout user (requires Bearer token)
  - Deletes session from database
  
- **PUT /api/users/:id** - Update user (requires Bearer token)
  - Update user profile information
  
- **DELETE /api/users/:id** - Delete user (requires Bearer token)
  - Removes user and all associated data

### 4. Protected Routes
All listing and booking operations require authentication:

**Listings:**
- POST /api/listings (create)
- PUT /api/listings/:id (update)
- DELETE /api/listings/:id (delete)
- GET /api/listings/:id/bookings (view property bookings)
- PUT /api/listings/:id/status (approve/deny bookings)
- GET /api/users/:listerId/listings (view user's listings)

**Bookings:**
- GET /api/bookings/users/:userID (get user's bookings)
- POST /api/bookings (create booking)
- PUT /api/bookings/:bookingID/approve (approve booking)
- PUT /api/bookings/:bookingID/deny (deny booking)

**Note:** GET /api/listings (browse all listings) remains public

## Frontend Implementation

### 1. API Configuration (`frontend/src/utils/api.js`)
- Axios instance with automatic token injection
- Request interceptor adds Bearer token from localStorage
- Response interceptor handles 401 errors (clears token on auth failure)
- Exported auth functions: `register`, `login`, `logout`

### 2. Auth Context (`frontend/src/context/AuthContext.jsx`)
- React Context for global authentication state
- Manages user data and token in localStorage
- Provides hooks: `useAuth()` with methods:
  - `login(username, password)` - Authenticate user
  - `register(userData)` - Create new account
  - `logout()` - Clear session
  - `isAuthenticated` - Boolean flag
  - `user` - Current user object
  - `token` - Current session token

### 3. Auth Components
- **Login** (`frontend/src/components/Login.jsx`) - Login form
- **Register** (`frontend/src/components/Register.jsx`) - Registration form
- **AuthModal** (`frontend/src/components/AuthModal.jsx`) - Modal wrapper with tab switching
- **Navigate** (`frontend/src/components/Navigate.jsx`) - Navigation with login/logout buttons

### 4. Integration in App
The AuthProvider wraps the entire application in `main.jsx`, making authentication state available throughout the component tree.

## Database Schema

### Sessions Table
```sql
CREATE TABLE Sessions (
    sessionID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT,
    sessionToken VARCHAR(100) NOT NULL UNIQUE,
    expiry DATETIME NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);
```

### Indexes
- `idx_sessions_token` - Fast session lookup by token
- `idx_sessions_user` - Fast lookup of user's sessions

## Usage Flow

### Registration
1. User fills registration form
2. Frontend calls `authAPI.register(userData)`
3. Backend hashes password with salt
4. User record created in database
5. User can now login

### Login
1. User enters credentials
2. Frontend calls `authAPI.login({ username, password })`
3. Backend verifies password
4. Backend creates session with 24-hour expiry
5. Frontend stores token and user in localStorage
6. Token automatically included in all subsequent requests

### Protected Requests
1. User makes API request (e.g., create listing)
2. Axios interceptor adds `Authorization: Bearer <token>` header
3. Backend middleware validates token
4. Request proceeds if valid, returns 401 if invalid
5. Frontend interceptor catches 401, clears localStorage

### Logout
1. User clicks logout button
2. Frontend calls `authAPI.logout()`
3. Backend deletes session from database
4. Frontend clears localStorage

## Security Features

1. **Password Security**: SHA-256 HMAC with random 16-byte salt
2. **Timing-Safe Comparison**: Prevents timing attacks on password verification
3. **Token Expiration**: Sessions expire after 24 hours
4. **Secure Token Generation**: Cryptographically random 64-character tokens
5. **Middleware Protection**: All sensitive routes require valid session
6. **Cascade Deletion**: Sessions deleted when user is deleted

## Testing the Implementation

### Test Registration
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123","email":"test@example.com"}'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

### Test Protected Route
```bash
curl -X GET http://localhost:3000/api/listings \
  -H "Authorization: Bearer <your-token-here>"
```

### Test Logout
```bash
curl -X POST http://localhost:3000/api/logout \
  -H "Authorization: Bearer <your-token-here>"
```

## Environment Variables
Make sure your `.env` file includes:
```
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=Rentals
```

## Future Enhancements (Optional)
- Refresh tokens for longer sessions
- Password reset functionality
- Email verification
- OAuth integration (Google, Facebook)
- Role-based access control (RBAC)
- Rate limiting on login attempts
- Session management (view/revoke active sessions)
