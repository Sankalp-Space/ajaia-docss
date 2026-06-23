# Ajaia Docs

A full-stack collaborative document editor built as a job assessment submission.

**Live app:** https://ajaia-docss.vercel.app  
**Backend API:** https://ajaia-docss-server.onrender.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, TipTap |
| Backend | Node.js, Express |
| Auth + Database | Supabase |
| Deploy — Frontend | Vercel |
| Deploy — Backend | Render |

---

## Features

### Working
- Email/password login and signup via Supabase Auth
- Create, rename, edit, and reopen documents
- Rich text editor: **bold**, *italic*, underline, H1, H2, bullet list, numbered list
- Manual save button + auto-save every 30 seconds with status indicator
- Upload `.txt` or `.md` files — converted into a new document automatically
- Share a document with another user by email
- Dashboard shows **My Documents** and **Shared With Me** separately
- Full persistence via Supabase (documents + shares tables)
- 1 automated backend test (Jest + Supertest) — auth middleware 401 check

### Intentionally cut
- Real-time collaboration — requires WebSocket infrastructure (Socket.io or Supabase Realtime), out of scope for this timeline
- Version history — would need a `document_versions` table and diffing logic
- Export to PDF — requires a headless renderer like Puppeteer; added complexity without core value

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free tier is fine)

### 1. Clone the repo

```bash
git clone https://github.com/Sankalp-Space/ajaia-docss.git
cd ajaia-docss
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Authentication → Users** and create two test users:
   - `user1@test.com` / `password123`
   - `user2@test.com` / `password123`

### 3. Configure environment variables

```bash
# Backend
cp server/.env.example server/.env

# Frontend
cp client/.env.example client/.env
```

Fill in both files using values from **Supabase Dashboard → Settings → API**:

**`server/.env`**
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

**`client/.env`**
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:4000
```

### 4. Install dependencies and run

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev

# Terminal 2 — frontend
cd client
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:4000/health

### 5. Run the test suite

```bash
cd server
npm test
```

---

## Test Credentials

| Email | Password |
|---|---|
| user1@test.com | password123 |
| user2@test.com | password123 |

---

## Project Structure

```
ajaia-docs/
  client/                   React + Vite frontend
    src/
      lib/                  supabase.js, api.js
      context/              AuthContext.jsx
      components/           Navbar, ProtectedRoute, ShareModal, FileUploadButton
      pages/                Login, Signup, DocumentList, DocumentEditor
  server/                   Express API
    middleware/             auth.js (JWT verification)
    routes/                 documents.js, shares.js, upload.js
    tests/                  documents.test.js
    app.js                  Express app (exported for testing)
    index.js                Entry point (listen only)
    supabase.js             Service-role Supabase client
  supabase/
    schema.sql              Tables + RLS policies
  README.md
  ARCHITECTURE.md
  AI_WORKFLOW.md
  SUBMISSION.md
```
