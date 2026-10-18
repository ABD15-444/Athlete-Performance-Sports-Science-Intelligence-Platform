# Backend API — Phase 2

Node.js + Express REST API for the Athlete Performance & Sports Science Intelligence Platform.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with your real credentials
npm run dev            # starts with nodemon on port 3001
```

## Environment Variables

| Variable       | Description                                    |
|---------------|------------------------------------------------|
| DATABASE_URL   | Full PostgreSQL connection string              |
| PORT           | Port for the Express server (default: 3001)    |
| FRONTEND_URL   | Allowed CORS origin (optional, default *)      |

## Key Endpoints

- GET  /api/health
- GET  /api/athletes
- GET  /api/athletes/:id
- POST /api/athletes
- POST /api/athletes/:id/biometrics
- GET  /api/teams
- GET  /api/teams/:id/overview
- POST /api/sessions
- POST /api/sessions/:id/athletes
- POST /api/athletes/:id/injury
- PATCH /api/injuries/:id/status
