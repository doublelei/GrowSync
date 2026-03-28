# Parent Auth Unlock — Design Spec

## Problem

GrowSync has zero authentication. All features (including admin: grade entry, proof approval) are visible to anyone. We need to restrict admin access to the parent while keeping the app open for the student by default.

## Solution: Parent Password Unlock

A hidden unlock mechanism that elevates the session to "parent" mode, revealing the Admin tab. No login page, no middleware, no database changes.

## Architecture

### Default State

All visitors see the app in student mode:
- Dashboard tab: visible
- Quests tab: visible (can view and submit habit proofs)
- Records page: visible
- Rules page: visible
- Admin tab: **hidden**

### Unlock Flow

1. A small, unobtrusive lock icon (🔒) in the page header area
2. Clicking it opens a password dialog
3. Password is sent to a Server Action which:
   - Compares against `AUTH_PASSWORD_PARENT` env var
   - If correct: sets a signed `httpOnly` cookie (`growsync_role=parent`)
   - If wrong: returns error
4. Page reloads, Server Component reads cookie → passes `isParent=true` to client
5. Admin tab becomes visible, lock icon changes to 🔓
6. Clicking 🔓 triggers a logout Server Action (clears cookie), back to student mode

### Cookie Security

- **httpOnly**: not accessible via JavaScript
- **Secure**: only sent over HTTPS (Vercel default)
- **SameSite=Strict**: no cross-site requests
- **HMAC signed**: cookie value is `parent.<signature>` where signature = HMAC-SHA256(secret, "parent")
- Server Action verifies signature before trusting the role
- Cookie max-age: 7 days (parent stays logged in for a week)

### Role Determination

The root `page.tsx` (currently `"use client"`) needs to read the cookie server-side. Approach:
- Convert the role-reading logic to a Server Component wrapper or use a Server Action called on mount
- Pass `isParent: boolean` as a prop to the client component tree
- Admin tab conditionally rendered based on this prop

## Environment Variables

```
AUTH_PASSWORD_PARENT=<parent-password>
AUTH_SECRET=<random-string-for-hmac>
```

Both must be set in Vercel project settings. `AUTH_SECRET` should be a random 32+ character string.

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/auth.ts` | Create | HMAC sign/verify helpers, cookie name constant |
| `src/app/auth/actions.ts` | Create | Server Actions: `login(password)`, `logout()`, `getRole()` |
| `src/components/auth-lock.tsx` | Create | Lock icon + password dialog component |
| `src/app/page.tsx` | Modify | Read role server-side, pass `isParent` to client components |
| `.env.example` | Modify | Add `AUTH_PASSWORD_PARENT` and `AUTH_SECRET` |

## Out of Scope

- No Middleware (no route protection needed)
- No login page / dedicated route
- No Supabase Auth integration
- No database schema changes
- No RLS policy changes
- No student password
- No registration flow
- No third-party auth libraries
