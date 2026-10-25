# Signal Bot MVP

This project is a minimal but functional MVP for a signal-driven trading monitor. It includes:

- React + Vite dashboard
- Express API backend
- PostgreSQL database
- Redis-ready environment
- signal ingestion, validation and simulation endpoints
- sample trader, token and execution data

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: PostgreSQL
- Cache: Redis (prepared for future queueing)

## Quick start

1. Install dependencies at the project root:
   npm install

2. Start PostgreSQL and Redis with Docker:
   npm run docker:up

3. Start the backend and frontend:
   npm run dev

4. Open the app:
   http://localhost:5173

5. API base:
   http://localhost:3001/api

## Environment

Create a `.env` file in the backend folder if you need custom configuration.

Example:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/signalbot
REDIS_URL=redis://localhost:6379
```

## Available endpoints

- GET /api/health
- GET /api/dashboard
- GET /api/traders
- GET /api/signals
- GET /api/trades
- GET /api/tokens
- POST /api/simulate

## Notes

This is an MVP focused on monitoring and validating trader signals. It does not include live market execution or real exchange integration yet.
