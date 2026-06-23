# AI Workflow

## Tools Used

| Tool | Purpose |
|---|---|
| **Claude Code** (VSCode extension) | Scaffolding, backend routes, frontend components, bug fixes, test setup |
| **Claude.ai** (web) | Architecture planning, stack selection rationale, prompting strategy |

---

## Where AI Saved the Most Time

### 1. Scaffolding the full project structure (~30 minutes → ~3 minutes)
Generating `package.json` files for both workspaces, `.env.example` files, Vite/Tailwind/PostCSS config, and the base folder structure would normally involve a lot of tab-switching and copy-paste from docs. Claude produced all of it in one pass with correct dependency versions.

### 2. Supabase RLS policies
Row Level Security policy syntax is verbose and easy to get subtly wrong. Claude generated the full schema — tables, trigger, and all six RLS policies — correctly on the first attempt. Writing and debugging this by hand against the Supabase docs would have taken significantly longer.

### 3. Express middleware and route structure
The `auth` middleware pattern (extract Bearer token → `supabase.auth.getUser()` → attach `req.user`) and the `resolveDoc` helper (shared ownership/access check reused across routes) were generated with correct async/await and error handling. This is the kind of boilerplate that is correct but tedious to write.

### 4. TipTap integration
TipTap's API is well-documented but has a subtle footgun: using `onClick` on toolbar buttons causes the editor to lose focus before the format command fires, so the selection is lost. Claude used `onMouseDown` with `e.preventDefault()` to prevent blur — the correct pattern. I would have caught this during testing but it saved a debugging cycle.

### 5. ESM + Jest on Windows
The test setup hit a Windows-specific error where `node_modules/.bin/jest` is a bash shim that `node` can't execute. Claude diagnosed this immediately and switched the test script to `node_modules/jest/bin/jest.js`. This would have taken meaningful time to track down in Jest's issue tracker.

---

## What I Changed or Rejected from AI Output

### Kept but modified: CORS configuration
The initial CORS setup used a single `CLIENT_ORIGIN` environment variable. When deploying to Render, I had a trailing slash in the value (`https://ajaia-docss.vercel.app/`) which caused all cross-origin requests to fail silently. I changed the config to a hardcoded array of allowed origins without trailing slashes rather than relying on the env var being set correctly on every deploy.

### Rejected: markdown conversion in DocumentEditorPage
An early draft of the file upload flow had the client doing the `.md` → HTML conversion using a bundled markdown parser. I moved this to the server (`/api/upload`) so the conversion is done once, server-side, and the client receives clean HTML. This keeps the client bundle smaller and the conversion logic in one place.

### Modified: auto-save implementation
The first auto-save draft used `useCallback` with `title` in the dependency array, which caused the 30-second interval to reset every time the title changed (making it never fire during continuous editing). I switched to a `titleRef` pattern: the save callback reads from a ref that stays in sync with the input, so the interval timer is stable and title changes don't reset it.

### Rejected: inline `deleteDoc` UI
The AI added a delete button directly to each document list row in the first pass. I removed it because accidental deletion with no confirmation dialog is a bad UX pattern, and I didn't have time to add a confirmation modal. The backend route exists and works; the UI will come back with proper UX.

---

## How I Verified Correctness and UX Quality

- **Backend:** tested every route manually with the running dev server before moving to the frontend. Checked 401 (no token), 403 (wrong user), 404 (bad ID), and happy-path responses.
- **Auth flow:** logged in as both test users and verified session persistence on refresh.
- **Sharing:** logged in as `user1`, shared a document with `user2@test.com`, then logged in as `user2` and confirmed the document appeared under "Shared With Me".
- **File upload:** tested `.txt`, `.md`, and an invalid `.pdf` to verify the error message.
- **Auto-save:** opened the browser network tab and confirmed PATCH requests fired at the 30-second mark after an edit.
- **Automated test:** `npm test` in the `server/` directory — 1 test, 1 pass.
- **Production:** verified the live Vercel URL, confirmed the backend health endpoint responded, and ran through the full create → edit → share → login-as-other-user flow on the deployed app.
