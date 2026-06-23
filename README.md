# Ajaia Docs

A full-stack collaborative document editor built for the Ajaia job assessment.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, TipTap |
| Backend | Node.js, Express |
| Database / Auth / Storage | Supabase |
| Deploy | Vercel (client), Render (server) |

## Project Structure

```
ajaia-docs/
  client/       React + Vite frontend
  server/       Express API
  supabase/     schema.sql to run in Supabase SQL editor
  README.md
  SUBMISSION.md
```

## Quick Start

### 1. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. Go to **Authentication → Users** and create the two test users:
   - `user1@test.com` / `password123`
   - `user2@test.com` / `password123`
4. Copy your project URL and keys from **Settings → API**.

### 2. Environment files

```bash
# client
cp client/.env.example client/.env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

# server
cp server/.env.example server/.env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

### 3. Install & run

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

Frontend: http://localhost:5173  
Backend health: http://localhost:4000/health

## Features

- Email / password auth via Supabase Auth
- Create, rename, edit, and reopen documents
- Rich text editor (bold, italic, underline, headings, lists) via TipTap
- Upload `.txt` / `.md` files → converts to new document
- Share a document with another user by email
- Full persistence in Supabase (documents + shares tables)
