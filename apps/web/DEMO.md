# TijarahJO portfolio demo

The existing React application can run without the .NET API or database. All records are fictional. Buyer and Seller are personas using the existing User role; Admin uses the existing Admin role. This classifieds demo has no checkout or payments.

## Run locally

From `apps/web`, run `npm ci` followed by `npm run dev:demo`.
For the deployed build, run `npm run build:demo` and `npm run preview`.
The ordinary `npm run build` retains the backend application unless `VITE_DEMO_MODE=true` is supplied.

## Walkthrough

1. Browse 30 listings across six categories. Search, filter, and open a listing.
2. Choose **Try as Buyer**. Add a favorite, refresh, compare two listings, and send a chat message. Replies and comparison text identify themselves as simulated.
3. Choose **Try as Seller**. Edit the sample profile or create a listing with a local image, then edit it, mark it sold, or delete it.
4. Choose **Try as Admin**. Inspect users, listings, reviews, reports and dashboard totals. Block a listing, resolve a report, and inspect the audit log. Switch back to Buyer to check the public result.
5. Try Arabic/RTL, English and dark/light mode. **Reset demo** restores the original records and removes uploaded images.

The toolbar is the easiest way to log in. Sample emails are `buyer@demo.example`, `seller@demo.example`, and `admin@demo.example`; their fictional password is `Demo123!`. These credentials never authenticate against the real backend. Phone fields contain deliberately invalid sample numbers.

## Persistence and boundaries

- Structured data uses localStorage key `tijarahjo_demo_v1`; uploaded images use the `tijarahjo-demo-images` IndexedDB database. Data belongs to the current browser/origin, not a shared server.
- Requests enter the demo adapter before fetch, CSRF or token refresh. Unsupported endpoints return an explicit error; they never fall through to the backend.
- Account switching clears query caches, auth hints, favorites and comparison selections. Content changes remain until reset. Browser site storage must be available to restore accounts across reloads.
- Requests are serialized to avoid lost updates from parallel writes. A storage quota failure falls back to memory for the current page.
- Google sign-in, registration, email/security operations, live AI/video recommendations and live directions are unavailable. Categories, roles, locations, banners and system settings are read-only. Chat replies are simulated text.
- Local illustrative photos come from the repository's existing category seed images; they do not represent verified items for sale.
- Demo builds disable the PWA service worker and remove old registrations on startup.

## Vercel configuration

Use repository `Zaid-22/TijarahJO` and a demo project/preview:

| Setting | Value |
| --- | --- |
| Root directory | `apps/web` |
| Framework | Vite |
| Install command | `npm ci` |
| Build command | `npm run build:demo` |
| Output directory | `dist` |

`vercel.json` sets the build command and SPA fallback for direct routes such as `/post/2`, `/profile`, `/chat/2` and `/admin`. No database, Google or AI keys are required. Keep real backend secrets out of the demo project. Test the preview before assigning a production alias.

## Validation

Run `npm run test:demo`, `npm run test:all`, `npm run lint` and `npm run build:demo`.
The 14 demo tests cover catalog/search/pagination, authorization, per-account favorites, listing lifecycle, moderation, reports/audit, conversations, comparison, concurrent requests, cancellation, reset, profile edits, upload rejection, suspension and storage quota recovery.

Local verification passed the demo build, ordinary build, full lint suite, 94 existing tests and 14 demo tests. The ordinary build excludes demo modules.

Browser checks exercised guest browsing, direct Buyer/Seller/Admin entry, profile routing, favorites across reload, chat and simulated replies, admin listing blocking and report auto-resolution. The browser file chooser was restricted, and the workspace disconnected during the final comparison check. Successful image upload plus reload, the final comparison screen, responsive/theme checks and the hosted deployment remain smoke-test items.
