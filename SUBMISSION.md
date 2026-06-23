# Submission

## Live URLs

| | URL |
|---|---|
| Frontend | https://ajaia-docss.vercel.app |
| Backend API | https://ajaia-docss-server.onrender.com |
| Backend health | https://ajaia-docss-server.onrender.com/health |

> **Note:** Backend is on Render free tier. The first request after a period of inactivity may take up to 30 seconds while the service wakes up.

## Demo Video

_Placeholder — to be recorded_

---

## Test Credentials

| Email | Password | Role |
|---|---|---|
| user1@test.com | password123 | Primary test user (owner) |
| user2@test.com | password123 | Secondary test user (sharing recipient) |

---

## How to Test the Core Flows

1. **Auth** — visit the live URL, sign in as `user1@test.com`
2. **Create document** — click **+ New Document**, type in the editor
3. **Rich text** — use the toolbar: bold, italic, underline, H1, H2, bullet list, numbered list
4. **Rename** — click the document title at the top and edit it inline
5. **Save** — click **Save** or wait 30 seconds for auto-save (watch for "Saved" indicator)
6. **File upload** — click **Upload File**, choose a `.txt` or `.md` file
7. **Sharing** — open a document, click **Share**, enter `user2@test.com`
8. **Shared view** — log out, log in as `user2@test.com`, see the document under **Shared With Me**

---

## What Is Working

- Email/password login and signup
- Document creation, rename, edit, persist
- Rich text: bold, italic, underline, H1, H2, bullet list, numbered list
- Manual save + auto-save every 30 seconds
- File upload (`.txt` and `.md` → new document)
- Share document by email
- Owned and shared documents shown separately on the dashboard
- Full persistence via Supabase Postgres
- 1 automated backend test (Jest + Supertest): `POST /api/documents` returns 401 with no token

---

## What Is Incomplete

- **Delete document UI** — the backend `DELETE /api/documents/:id` route is implemented and tested; the UI button was intentionally omitted without a confirmation dialog (accidental deletion is bad UX)
- **Revoke share access** — the backend `DELETE /api/documents/:id/shares/:shareId` route exists; the ShareModal UI does not yet show a remove button
- **Demo video** — placeholder above

---

## What I'd Build Next

1. **Debounced auto-save** — replace the fixed 30-second interval with a keystroke-debounced save (fires 1.5s after the user stops typing)
2. **Delete with confirmation modal** — destructive actions need a confirm step
3. **Revoke share UI** — remove button in the Share modal next to each listed email
4. **Supabase Realtime** — subscribe to document row changes so shared users see updates live without manual refresh

---

## Files Submitted

```
ajaia-docs/
  client/
    index.html
    vite.config.js
    tailwind.config.js
    postcss.config.js
    package.json
    .env.example
    src/
      main.jsx
      App.jsx
      index.css
      lib/
        supabase.js
        api.js
      context/
        AuthContext.jsx
      components/
        Navbar.jsx
        ProtectedRoute.jsx
        ShareModal.jsx
        FileUploadButton.jsx
      pages/
        LoginPage.jsx
        SignupPage.jsx
        DocumentListPage.jsx
        DocumentEditorPage.jsx

  server/
    app.js
    index.js
    supabase.js
    package.json
    .env.example
    middleware/
      auth.js
    routes/
      documents.js
      shares.js
      upload.js
    tests/
      documents.test.js

  supabase/
    schema.sql

  .gitignore
  README.md
  ARCHITECTURE.md
  AI_WORKFLOW.md
  SUBMISSION.md
```
