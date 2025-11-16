# API Authentication Quick Reference

## Public Endpoints (No Token Required)

### Authentication
- **POST** `/api/users/register` - Register new user
- **POST** `/api/login` - Login and get token

### Listings
- **GET** `/api/listings` - Browse all listings (with optional filters)

## Protected Endpoints (Bearer Token Required)

### Authentication
- **POST** `/api/logout` - Logout (delete session)
- **PUT** `/api/users/:id` - Update user profile
- **DELETE** `/api/users/:id` - Delete user account

### Listings
- **POST** `/api/listings` - Create new listing
- **PUT** `/api/listings/:id` - Update listing
- **DELETE** `/api/listings/:id` - Delete listing
- **GET** `/api/listings/:id/bookings` - Get bookings for a property
- **PUT** `/api/listings/:id/status` - Approve/deny booking
- **GET** `/api/users/:listerId/listings` - Get user's listings

### Bookings
- **GET** `/api/bookings/users/:userID` - Get user's bookings
- **POST** `/api/bookings` - Create new booking
- **PUT** `/api/bookings/:bookingID/approve` - Approve booking
- **PUT** `/api/bookings/:bookingID/deny` - Deny booking

## Token Format

All protected endpoints require an Authorization header:

```
Authorization: Bearer <your-session-token>
```

## Example Requests

### Register
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepass123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepass123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "token": "abc123def456...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Create Listing (Protected)
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer abc123def456..." \
  -d '{
    "listerId": 1,
    "title": "Beautiful Apartment",
    "description": "Spacious 2BR apartment",
    "price": 150.00,
    "location": "123 Main St, City"
  }'
```

### Logout
```bash
curl -X POST http://localhost:3000/api/logout \
  -H "Authorization: Bearer abc123def456..."
```

## Response Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (missing fields, validation error)
- **401** - Unauthorized (missing/invalid token)
- **404** - Not Found
- **409** - Conflict (username already exists)
- **500** - Internal Server Error

## Error Response Format

```json
{
  "message": "Error description here"
}
```

Common auth errors:
- `"Authentication required"` - No token provided
- `"Invalid or expired session"` - Token is invalid or expired
- `"Invalid credentials"` - Wrong username/password during login
