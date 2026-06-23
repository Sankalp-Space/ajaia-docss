# Submission Notes

## Live URLs

- **Frontend (Vercel):** _add after deploy_
- **Backend (Render):** _add after deploy_

## Test Credentials

| Email | Password |
|---|---|
| user1@test.com | password123 |
| user2@test.com | password123 |

## How to Test the Main Flows

1. **Auth** — Sign up with a new email or log in with a test user above.
2. **Create doc** — Click "New Document", type in the editor, changes auto-save.
3. **Rich text** — Use the toolbar: bold, italic, underline, H1/H2, bullet & numbered lists.
4. **Rename** — Click the document title at the top to rename inline.
5. **File upload** — Click "Upload File", choose a `.txt` or `.md` file; it becomes a new document.
6. **Sharing** — Open a document, click "Share", enter `user2@test.com`. Log in as user2 to see it under "Shared with me".

## Architecture Notes

- The Express server uses the **service-role key** for server-side Supabase operations (file uploads, share lookups by email) where RLS would otherwise block cross-user queries.
- The React client uses the **anon key** with the authenticated user's JWT for all direct Supabase calls.
- TipTap stores content as HTML; the server saves/loads raw HTML strings.
