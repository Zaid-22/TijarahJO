# Auth Runtime QA Matrix

Date: 2026-04-02
Scope: Frontend auth runtime behavior under network flaps and session revalidation.

## Preconditions
- Frontend is running.
- Backend can be toggled between available/unavailable (or network can be disabled/enabled).
- Browser devtools are available for offline simulation.

## Current Behavior Notes
- On signed-in hard refresh, the app keeps the current page shell visible while `checkAuth()` revalidates the session.
- Public-route header actions that depend on auth wait for auth loading to finish instead of rendering the logged-out state first.
- The intended UX is "quiet revalidation": no temporary `Sign In` flash and no dedicated full-screen reload splash during a normal refresh.

## Matrix
| ID | Scenario | Setup | Action | Expected Result |
|---|---|---|---|---|
| AR-01 | Initial authenticated load (healthy network) | Valid auth session cookie exists | Load app | User remains authenticated, no auth error toast, `loading` spinner clears. |
| AR-02 | Initial unauthenticated load | No valid auth cookie | Load app | User is signed out with session-expired style message, no auth loop. |
| AR-03 | Offline at startup | Browser offline before app load | Load app | Auth check reports offline message, app does not spam repeated identical toasts. |
| AR-04 | Offline flap dedupe | Start online, then go offline | Trigger focus/visibility changes repeatedly within 12s | Only one offline auth error toast appears during cooldown window. |
| AR-05 | Offline -> online recovery | Offline toast already shown | Re-enable network, focus tab | Session revalidation runs, consecutive network-failure counter resets, auth state recovers if backend/session valid. |
| AR-06 | Online but backend unavailable | Browser online, backend stopped | Trigger `checkAuth` via focus/visibility | Backend-unavailable toast appears, then duplicates are suppressed during cooldown. |
| AR-07 | Message-change emission | Offline toast shown first | Restore network but keep backend unavailable | A different message (backend unavailable) is allowed once immediately. |
| AR-08 | Revalidation throttle growth | Repeated network failures | Repeated focus/visibility events | Revalidation interval expands (adaptive throttle), reducing request churn. |
| AR-09 | Retry backoff growth | Repeated network failures | Observe `checkAuth` retry timing | Retry delay increases exponentially up to max cap, then remains capped. |
| AR-10 | Login success + failed hydration | Force login response success but `/auth/me` auth_error | Attempt login | Login fails safely (no fake authenticated state), signed-out state is enforced. |
| AR-11 | Signup success + failed hydration | Force signup response success but `/auth/me` auth_error | Attempt signup | Signup fails safely (no fake authenticated state), signed-out state is enforced. |
| AR-12 | Stale checkAuth race prevention | Trigger rapid overlapping auth checks | Fire focus/storage/authSessionChanged quickly | Old async responses do not overwrite newer auth state. |
| AR-13 | Guest mode persistence | Enable guest mode | Trigger auth checks while no session | App stays in guest mode (`isGuest=true`, `isAuthenticated=false`, `user=null`) without repeated auth failure toasts or forced session restoration. |
| AR-14 | Cross-tab auth sync | Open two tabs | Sign out in one tab | Other tab revalidates and reflects signed-out state. |
| AR-15 | Cooldown expiry re-emission | Show an auth error toast | Repeat same condition after >12s | Same message is allowed to toast again after cooldown expiry. |
| AR-16 | Authenticated hard refresh UI stability | Valid auth session cookie exists on a public route (for example `/`) | Hard refresh the page | The page remains visible while auth revalidates, and logged-out header actions do not flash before the authenticated account controls return. |

## Quick Smoke Sequence
1. Sign in with backend healthy and confirm AR-01.
2. Hard refresh a public route while signed in and confirm AR-16.
3. Toggle browser offline and refocus tab repeatedly to confirm AR-04.
4. Toggle online with backend stopped to confirm AR-07.
5. Keep backend stopped for repeated focus events to confirm AR-08/AR-09.
6. Restart backend and refocus to confirm AR-05.

## Implementation References
- `src/contexts/AuthContext.tsx`
- `src/contexts/useAuthProviderController.ts`
- `src/contexts/authRuntimePolicy.ts`
- `src/app/App.tsx`
- `src/features/marketplace/components/Header.tsx`
- `tests/unit/auth-runtime-policy.test.cjs`
- `tests/unit/auth-runtime-message-flow.test.cjs`
