# Architecture

## Stack Decisions

### Why Supabase?
Supabase bundles Postgres, Auth, and Row Level Security in one managed service. For a document editor the core requirements are: user identity, per-user data isolation, and shared access — all three are solved at the database layer through RLS policies without writing custom middleware for every query. On a one-person timeline this is a significant force multiplier.

### Why a separate Express backend instead of Supabase Edge Functions?
Two reasons:

1. **File upload handling** — Multer and Node streams are straightforward. Edge Functions have body size limits and a different runtime model that would require more ceremony for the same result.
2. **Service-role operations** — Sharing a document requires looking up another user's record by email, which bypasses RLS by design. Keeping the service-role key exclusively on the Express server (never in the browser) is the correct security boundary. Putting it in an Edge Function would work but offers no advantage here.

### Why TipTap?
TipTap is built on ProseMirror, which is the same foundation as Notion and Linear's editors. It has a clean React API (`useEditor`, `EditorContent`), ships a `StarterKit` that covers all required formatting in one import, and stores content as HTML strings — which map directly to a Postgres `text` column without any serialization work.

### Why Vercel + Render?
- Vercel has zero-config Vite support: point at the `client/` directory, it detects the framework and sets `dist/` automatically.
- Render's free tier supports persistent Node.js processes (unlike Vercel serverless functions, which have execution timeouts that would interrupt long auto-saves). The trade-off is the 15-minute cold-start sleep on the free plan.

---

## Data Flow

```
Browser
  │
  ├── Supabase JS SDK (anon key)
  │     └── Auth: signIn / signUp / onAuthStateChange
  │
  └── fetch() with Bearer JWT
        │
        └── Express (Render)
              │
              ├── auth middleware
              │     └── supabase.auth.getUser(token)  ← validates JWT
              │
              ├── /api/documents  ←→  Supabase Postgres (service-role)
              ├── /api/documents/:id/share
              └── /api/upload
                    └── multer (memory) → parse → return { title, content }
```

**Auth flow in detail:**
1. User signs in via Supabase on the client — receives a JWT access token
2. Every API call sends `Authorization: Bearer <token>`
3. The Express `auth` middleware calls `supabase.auth.getUser(token)` — Supabase validates the token server-side and returns the user object
4. `req.user` is attached and all subsequent route logic uses `req.user.id` and `req.user.email`

**Why the server uses the service-role key:**
RLS policies on the `shares` table can only check `auth.uid()` — the currently authenticated user. Cross-user lookups (e.g. "find all documents shared with email X") require a privileged client that bypasses RLS. The service-role key stays in the server environment and is never sent to the browser.

---

## Database Schema

```sql
documents  (id, title, content, owner_id → auth.users, created_at, updated_at)
shares     (id, document_id → documents, owner_id → auth.users, shared_with_email, created_at)
```

RLS policies enforce:
- Owners can SELECT / INSERT / UPDATE / DELETE their own documents
- Shared recipients can SELECT documents where their email appears in the `shares` table
- Only owners can INSERT / DELETE share records

The `updated_at` column is maintained by a Postgres trigger (`set_updated_at`) — the application never sets it manually.

---

## Key Tradeoffs

| Decision | What was gained | What was given up |
|---|---|---|
| HTML string in `content` column | No serialization layer; TipTap reads/writes directly | Not queryable as structured data; full-text search would need `tsvector` |
| Service-role key on Express server | Clean security boundary; enables cross-user email lookups | Extra round-trip vs. direct Supabase client calls from browser |
| Hardcoded CORS origins | Explicit and auditable | Requires redeploy to add a new allowed origin |
| Auto-save via `setInterval` | Simple, no extra dependencies | Not debounced — fires even if the 30s boundary hits mid-keystroke |
| `marked` for .md upload on server | Consistent HTML output regardless of client | Server does rendering work; large files could be slow |

---

## What I'd Build Next (2–4 More Hours)

1. **Debounced auto-save** — replace the 30-second interval with a `useCallback`-debounced save triggered 1.5 seconds after the last keystroke. Feels more like Google Docs.

2. **Delete document** — the backend route exists (`DELETE /api/documents/:id`), the UI just needs a confirmation dialog and a delete button on the document list row.

3. **Revoke share access** — the backend route also exists (`DELETE /api/documents/:id/shares/:shareId`). The ShareModal needs a remove button next to each listed email.

4. **Supabase Realtime for basic presence** — subscribe to Postgres changes on a document row so that when one user saves, other viewers see the updated content without polling. This is one `supabase.channel()` call and stops well short of operational-transform collaboration.
