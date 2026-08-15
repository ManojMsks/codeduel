# CodeDuel

A lightweight platform for head-to-head Codeforces-style matchups — users enter their Codeforces IDs and compete against each other in live duels. Intended for students, competitive programmers, and hobbyist contest organizers who want quick, real-time matchups.

## Quick summary
- Frontend: Vite + React single-page app (frontend/src).  
- Backend: Node.js service (backend/) exposing HTTP routes and realtime updates.  
- Data: models in backend/models (User, Game, Problem).  
- Realtime: frontend connects to backend via a socket (frontend/src/socket.js) for live duel updates.

## Stack
- Language(s): JavaScript (frontend + backend), CSS, HTML  
- Framework / runtime: Vite + React (frontend), Node.js (backend) — Express-style routing structure (routes/controllers)  
- Notable modules & files:
  - backend/server.js — backend entry point
  - backend/routes/*.js — route definitions (gameRoutes.js, userRoutes.js)
  - backend/controllers/*.js — request handlers (gameController.js, userController.js)
  - backend/models/*.js — data models (Game.js, Problem.js, User.js)
  - backend/utils/problemSeeder.js — problem seeder script
  - frontend/src/pages/* — main page components (Home, Lobby, Battle)

## How it's organized
Top-level tree (annotated):

```
backend/                 Node.js backend
  server.js              HTTP + socket server entry point
  package.json           backend dependencies & scripts
  controllers/           business logic & handlers
    gameController.js
    userController.js
  models/                data schemas (User, Game, Problem)
    Game.js
    Problem.js
    User.js
  routes/                route wiring (gameRoutes.js, userRoutes.js)
  utils/
    problemSeeder.js     helper to seed problems for matches
  codeduel_load_test.js  simple load-test script

frontend/                Vite + React frontend
  package.json           frontend dependencies & scripts
  vite.config.js
  index.html
  src/
    main.jsx
    App.jsx
    socket.js            socket wrapper for realtime updates
    pages/
      Home.jsx
      Lobby.jsx
      Battle.jsx
      *.css
```

How it fits together:
- The frontend is a single-page React app served separately (Vite dev server) or deployed as static assets.
- The backend exposes REST endpoints for user and game management and uses sockets to push real-time updates (match state, problem assignment, scores).
- Models (backend/models) represent the persistent objects; controllers contain the domain logic and use routes to expose HTTP endpoints. The problem seeder pre-populates contest problems used during duels.

## Architecture diagrams

Mermaid diagram (recommended renderer):

```mermaid
flowchart TD
  A[User browser (React)] -->|HTTP| B[Backend API (Node.js)]
  A -->|Socket.io| C[Backend Socket Server]
  B -->|CRUD| D[Database (MongoDB / persistent store)]
  C -->|push events| A
  B -->|reads/writes| D
  subgraph Backend
    B
    C
    D
  end
  subgraph Frontend
    A
  end
```

ASCII fallback (if Mermaid isn't available):

- User browser (React SPA)
  - HTTP requests --> Backend API (Node.js / Express)
  - WebSocket --> Backend Socket Server
- Backend API <--> Database (MongoDB / other)
- Backend Socket Server pushes real-time events to connected clients

## How to run it (shortest path)

Backend (from repo root):
```bash
cd backend
# install
npm install
# run (common options: npm start or node server.js)
npm run start   # or: node server.js
```

Frontend (from repo root):
```bash
cd frontend
npm install
npm run dev     # starts Vite dev server (commonly at http://localhost:5173)
```

Notes:
- If the backend expects a database, set the connection string in an env var (commonly `MONGODB_URI` or `DATABASE_URL`). Also set `PORT` for the backend and `VITE_*` env vars for frontend if needed.
- There is a seeder script at `backend/utils/problemSeeder.js` to populate problems — run it after the database is up:
```bash
cd backend
node utils/problemSeeder.js
```
- If sockets are used, ensure frontend connects to the correct backend address (check `frontend/src/socket.js`).

## What to check / troubleshooting
- server entry: `backend/server.js` — confirm the startup script name in `backend/package.json` (start, dev).
- Database connection: set and verify the DB environment variable (MONGO_URI / MONGODB_URI).
- CORS / client URL: if the frontend runs on a different host/port, enable CORS or set CLIENT_URL/ORIGIN accordingly.
- If duels rely on an external Codeforces API, check controllers for any external calls and set any required keys or rate-limit handling.

## Suggestions / next improvements
- Add a top-level README that points to `backend/README.md` and `frontend/README.md` for per-service setup and env examples.
- Add a Docker Compose file to run frontend, backend, and database together for easy local testing.
- Add basic tests for controllers and React components.

## Try asking
- "How does match creation work in backend/controllers/gameController.js — which fields does the Game model expect?"
- "What environment variables does backend/server.js read and what are their defaults?"
- "How does the Battle page (frontend/src/pages/Battle.jsx) listen for and handle socket events?"
