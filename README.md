# Chapter Performance Dashboard API

A RESTful API for managing and retrieving chapter performance data with features like caching, rate limiting, and pagination.

## Features

- RESTful API endpoints for chapter management
- Redis caching for improved performance
- Rate limiting (30 requests/minute per IP)
- Pagination and filtering support
- Admin-only chapter upload functionality
- MongoDB integration for data persistence

## Tech Stack

- Node.js
- Express.js
- MongoDB (with Mongoose)
- Redis (for caching & rate limiting)

## API Endpoints

### GET /api/v1/chapters

- Returns all chapters with pagination
- Supports filtering by: class, unit, status, weakChapters, and subject
- Query parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10)
  - class: Filter by class
  - unit: Filter by unit
  - status: Filter by status
  - weakChapters: Filter by weak chapters (true/false)
  - subject: Filter by subject

### GET /api/v1/chapters/:id

- Returns a specific chapter by ID

### POST /api/v1/chapters

- Upload chapters to database (Admin only)
- Accepts JSON file upload
- Returns failed uploads if any

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

- PORT: Server port (default: 3000)
- MONGODB_URI: MongoDB connection string
- REDIS_URL: Redis connection string
- JWT_SECRET: Secret key for JWT authentication

## Rate Limiting

- 30 requests per minute per IP address
- Implemented using Redis

## Caching

- GET /api/v1/chapters results are cached for 1 hour
- Cache is invalidated when new chapters are added

## Error Handling

- Comprehensive error handling for all endpoints
- Validation for chapter uploads
- Proper error messages and status codes

## Security

- JWT-based authentication for admin routes
- Rate limiting to prevent abuse
- Input validation and sanitization

## License

MIT
