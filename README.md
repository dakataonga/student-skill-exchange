# Student Skill Exchange Platform

A student-to-student marketplace for exchanging or paying for skills
(programming, design, tutoring, photography, music, languages, repair, etc).

## Stack
- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT, role-based (student / admin)

## Features implemented
- Register / login, with student ID field for verification
- Admin-only endpoint to verify a student's ID before they can post
  listings or send requests (browsing is open to everyone)
- Skill listings: create, search/filter by category or keyword
- Payment modes per listing: barter only, paid only, or either
- Requests: send a request, provider accepts/rejects, mark completed,
  mock "mark as paid" flag (stub for a real payment gateway later)
- Simple SQL-based mutual matching: shows students who offer something
  you want AND want something you offer
- Reviews after a completed session
- Reporting + admin report resolution

## Setup

### 1. Database
```bash
createdb skill_exchange
psql skill_exchange < backend/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # edit DATABASE_URL and JWT_SECRET
npm install
npm run dev             # runs on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev              # runs on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so no
extra CORS config is needed in development.

### 4. Make yourself an admin
After registering a user normally, promote it directly in the DB:
```sql
UPDATE users SET role = 'admin', verified = TRUE WHERE email = 'you@example.com';
```

## Project structure
```
backend/
  schema.sql              -- full DB schema
  src/
    server.js              -- Express app entry
    db.js                   -- Postgres pool
    middleware/auth.js       -- JWT auth, role, verification guards
    routes/
      auth.js                -- register/login
      skills.js               -- listings, wanted skills, matches
      requests.js             -- request lifecycle, mock payment
      reviews.js               -- post-session ratings
      admin.js                  -- verify users, manage reports
      reports.js                -- students file reports

frontend/
  src/
    api.js                  -- fetch wrapper with auth header
    AuthContext.jsx          -- logged-in user state
    pages/                     -- Login, Register, Browse, Profile, Requests, Admin
    components/                -- Navbar, SkillCard
```

## Where to go next (stretch goals)
- Real payment gateway (Stripe test mode) instead of the `paid` mock flag
- Real-time chat with Socket.io on top of the `messages` table (schema
  already has it, no routes built yet)
- Session scheduling/calendar UI around `requests.scheduled_at`
- File upload for `id_document_url` (currently just a text field)
