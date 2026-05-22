# Frontend File Assessment (2026-02-17)

Scope: historical static assessment of the legacy frontend source tree before the
current monorepo layout. Current frontend code now lives under `apps/web/src`.

## Summary

- rewrite: 3
- refactor: 23
- investigate-dead-code: 1
- keep: 56

## Per-File Matrix

| File | Kind | Lines | Imported By | any | Action | Priority | Notes |
|---|---:|---:|---:|---:|---|---|---|
| `src/App.tsx` | other | 262 | 1 | 0 | refactor | low | Moderate-large file (262 lines); Multiple effects (3) with no memoization hooks |
| `src/components/admin/AdminDashboard.tsx` | component | 122 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/admin/AdminLayout.tsx` | component | 122 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/admin/AdminRoute.tsx` | component | 22 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/admin/CategoriesManagement.tsx` | component | 538 | 1 | 4 | refactor | medium | Large file (538 lines) |
| `src/components/admin/RolesManagement.tsx` | component | 394 | 1 | 1 | refactor | low | Moderate-large file (394 lines) |
| `src/components/admin/UsersManagement.tsx` | component | 517 | 1 | 1 | refactor | medium | Large file (517 lines) |
| `src/components/chat/ChatList.tsx` | component | 85 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/chat/ChatWindow.tsx` | component | 174 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/figma/EditProductDialog.tsx` | component | 382 | 2 | 0 | refactor | low | Moderate-large file (382 lines) |
| `src/components/figma/Footer.tsx` | component | 184 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/figma/Header.tsx` | component | 407 | 1 | 0 | refactor | low | Moderate-large file (407 lines) |
| `src/components/figma/ImageWithFallback.tsx` | component | 121 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/components/figma/ProductCard.tsx` | component | 308 | 7 | 0 | refactor | low | Moderate-large file (308 lines) |
| `src/components/figma/SellItemDialog.tsx` | component | 448 | 2 | 1 | refactor | low | Moderate-large file (448 lines) |
| `src/components/ui/accordion.tsx` | component | 67 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/alert-dialog.tsx` | component | 157 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/alert.tsx` | component | 67 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/avatar.tsx` | component | 54 | 4 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/badge.tsx` | component | 47 | 6 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/button.tsx` | component | 58 | 24 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/card.tsx` | component | 93 | 6 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/dialog.tsx` | component | 138 | 6 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/dropdown-menu.tsx` | component | 258 | 2 | 0 | refactor | low | Moderate-large file (258 lines) |
| `src/components/ui/error-boundary.tsx` | component | 83 | 1 | 1 | keep | low | No major issues by static heuristics |
| `src/components/ui/input.tsx` | component | 22 | 11 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/label.tsx` | component | 25 | 7 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/logo.tsx` | component | 183 | 7 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/pagination.tsx` | component | 143 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/scroll-area.tsx` | component | 59 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/ScrollToTop.tsx` | component | 45 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/select.tsx` | component | 190 | 4 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/separator.tsx` | component | 29 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/sheet.tsx` | component | 142 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/sonner.tsx` | component | 48 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/switch.tsx` | component | 32 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/table.tsx` | component | 117 | 3 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/tabs.tsx` | component | 67 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/textarea.tsx` | component | 19 | 4 | 0 | keep | low | No major issues by static heuristics |
| `src/components/ui/utils.ts` | component | 7 | 20 | 0 | keep | low | No major issues by static heuristics |
| `src/constants/appConfig.ts` | constant | 40 | 10 | 1 | keep | low | No major issues by static heuristics |
| `src/constants/colors.ts` | constant | 6 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/constants/index.ts` | constant | 16 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/contexts/AuthContext.tsx` | context | 576 | 9 | 1 | refactor | medium | Large file (576 lines) |
| `src/data/categoryData.ts` | data | 134 | 6 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useAppTheme.ts` | hook | 41 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useChat.ts` | hook | 121 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useDebounce.ts` | hook | 22 | 3 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useFavorites.ts` | hook | 156 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useInfiniteScroll.ts` | hook | 135 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useLocalStorage.ts` | hook | 69 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useProducts.ts` | hook | 117 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/hooks/useUserProfile.ts` | hook | 125 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/lib/searchRanking.ts` | lib | 440 | 3 | 0 | refactor | low | Moderate-large file (440 lines) |
| `src/main.tsx` | other | 81 | 0 | 0 | keep | low | No major issues by static heuristics |
| `src/pages/AllProductsPage.tsx` | page | 548 | 1 | 0 | refactor | medium | Large file (548 lines) |
| `src/pages/CategoryPage.tsx` | page | 375 | 1 | 0 | refactor | low | Moderate-large file (375 lines) |
| `src/pages/ChatPage.tsx` | page | 251 | 1 | 1 | refactor | low | Moderate-large file (251 lines); Multiple effects (4) with no memoization hooks |
| `src/pages/EditProfilePage.tsx` | page | 587 | 1 | 3 | refactor | medium | Large file (587 lines) |
| `src/pages/FAQPage.tsx` | page | 121 | 1 | 1 | keep | low | No major issues by static heuristics |
| `src/pages/FavoritesPage.tsx` | page | 133 | 1 | 1 | keep | low | No major issues by static heuristics |
| `src/pages/HomePage.tsx` | page | 521 | 1 | 3 | refactor | medium | Large file (521 lines) |
| `src/pages/LoginPage.tsx` | page | 1012 | 1 | 16 | rewrite | high | Very large file (1012 lines); High any usage (16); Excess debug logs (6) |
| `src/pages/ProductDetailsPage.tsx` | page | 1282 | 1 | 0 | rewrite | high | Very large file (1282 lines) |
| `src/pages/ProfilePage.tsx` | page | 578 | 1 | 3 | refactor | medium | Large file (578 lines) |
| `src/pages/SearchResultsPage.tsx` | page | 269 | 1 | 1 | refactor | low | Moderate-large file (269 lines) |
| `src/pages/SellerProfilePage.tsx` | page | 490 | 1 | 9 | refactor | medium | Large file (490 lines); Type debt any usage (9) |
| `src/pages/SellItemPage.tsx` | page | 84 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/pages/SettingsPage.tsx` | page | 563 | 1 | 0 | refactor | medium | Large file (563 lines) |
| `src/routes/AppRoutes.tsx` | route | 761 | 1 | 2 | refactor | medium | Large file (761 lines) |
| `src/services/api.ts` | service | 2492 | 18 | 102 | rewrite | high | Very large file (2492 lines); High any usage (102) |
| `src/services/api/v1/client.ts` | service | 182 | 1 | 2 | keep | low | No major issues by static heuristics |
| `src/services/chatService.ts` | service | 153 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/styles/globals.css` | style | 380 | 1 | 0 | refactor | low | Moderate-large file (380 lines) |
| `src/translations.ts` | other | 122 | 13 | 0 | keep | low | No major issues by static heuristics |
| `src/types/api.ts` | type | 303 | 2 | 0 | refactor | low | Moderate-large file (303 lines) |
| `src/types/index.ts` | type | 132 | 23 | 0 | keep | low | No major issues by static heuristics |
| `src/utils/index.ts` | util | 36 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/utils/phone.ts` | util | 27 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/utils/sellerDisplayName.ts` | util | 13 | 2 | 0 | keep | low | No major issues by static heuristics |
| `src/utils/shareUtils.ts` | util | 117 | 1 | 0 | keep | low | No major issues by static heuristics |
| `src/vite-env.d.ts` | other | 11 | 0 | 0 | keep | low | No major issues by static heuristics |

## Highest-Risk Files

- `src/services/api.ts`: rewrite (high) - Very large file (2492 lines); High any usage (102).
- `src/pages/ProductDetailsPage.tsx`: rewrite (high) - Very large file (1282 lines).
- `src/pages/LoginPage.tsx`: rewrite (high) - Very large file (1012 lines); High any usage (16); Excess debug logs (6).

## Frontend Non-Src Files

| File | Lines | Action | Priority | Notes |
|---|---:|---|---|---|
| `.DS_Store` | 3 | keep | low | No major issue detected |
| `.env` | 2 | keep | low | No major issue detected |
| `.eslintrc.cjs` | 34 | keep | low | No major issue detected |
| `DEBUG_PROFILE_EDIT.md` | 95 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `PROJECT_REPORT.md` | 567 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `README.md` | 469 | refactor | low | Keep synchronized with current architecture and scripts |
| `docs/ERROR_ANALYSIS_AND_FIXES.md` | 890 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `docs/ERROR_DETECTION_SUMMARY.md` | 409 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `docs/FIXES_APPLIED.md` | 345 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `docs/ID_SYSTEM.md` | 362 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `docs/IMPLEMENTATION_GUIDE.md` | 549 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `docs/STRING_ID_IMPLEMENTATION_COMPLETE.md` | 357 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `docs/STRING_ID_TESTING.md` | 306 | consolidate-docs | low | Candidate for docs consolidation/archival to reduce duplication |
| `index.html` | 29 | keep | low | Bootstrapping and theme-preload script are fine |
| `package-lock.json` | 5780 | keep | low | Required for deterministic installs |
| `package.json` | 53 | refactor | medium | Dependency/version policy and script hardening should be maintained |
| `postcss.config.js` | 8 | keep | low | Build style config is acceptable |
| `tailwind.config.js` | 18 | keep | low | Build style config is acceptable |
| `tsconfig.json` | 33 | keep | low | Compiler config is acceptable |
| `tsconfig.node.json` | 12 | keep | low | Compiler config is acceptable |
| `vite.config.ts` | 87 | refactor | medium | Chunk strategy is good; continue tuning route-level lazy loading and vendor boundaries |

## Phase 4 Update (2026-02-17)

- Added the missing frontend docs README in the legacy frontend tree before the
  project moved into the current `apps/web` layout.
- Archived historical frontend fix docs into the legacy frontend docs archive.
- Replaced archived frontend docs at original paths with short pointer stubs to
  preserve path stability.
- Set the frontend ID system doc as the active canonical frontend
  technical doc.

## Phase 5 Update (2026-02-17)

- `src/services/api.ts` refactor completed:
  - reduced to thin orchestrator (`74` lines)
  - endpoint domains split across `src/services/api/v1/*` modules
- `src/pages/LoginPage.tsx` refactor completed:
  - reduced from `1012` to `576` lines
  - extracted reusable auth input UI and auth parsing/validation utilities:
    - `src/pages/login/AuthInputField.tsx`
    - `src/pages/login/loginUtils.ts`
- `src/pages/ProductDetailsPage.tsx` refactor completed:
  - reduced from `1282` to `642` lines
  - extracted page complexity into dedicated modules:
    - `src/pages/productDetails/ProductImageGallery.tsx`
    - `src/pages/productDetails/ProductActionDialogs.tsx`
    - `src/pages/productDetails/productDetailsUtils.ts`
- Validation after refactor:
  - `npm run lint` passed
  - `npm run build` passed

## Phase 6 Update (2026-02-17)

- Additional refactor pass completed:
  - `src/routes/AppRoutes.tsx` reduced from `805` to `634` lines
    - extracted shared route logic to:
      - `src/routes/appRoutesUtils.ts`
      - `src/routes/useProductDetailsRouteData.ts`
  - `src/contexts/AuthContext.tsx` reduced from `575` to `442` lines
    - extracted auth payload/user mapping helpers to:
      - `src/contexts/authUtils.ts`
- Dependency maintenance pass completed:
  - applied safe non-breaking updates with `npm update`
  - applied available non-breaking audit fixes with `npm audit fix`
  - re-ran gates:
    - `npm run lint` passed
    - `npm run build` passed
    - `npm audit --audit-level=high`: remaining `11` moderate advisories
      (dev-tooling chain; requires breaking upgrades such as Vite major bump)
- Backend validation re-run:
  - `dotnet build --no-restore -m:1 /nodeReuse:false` passed (`0` warnings, `0` errors)
  - `dotnet list package --vulnerable --include-transitive`: no vulnerable packages
  - `dotnet list package --deprecated --include-transitive`: legacy/deprecated transitive identity packages remain
