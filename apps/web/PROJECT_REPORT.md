# TijarahJo Frontend - Current Project Snapshot

**Reviewed:** 2026-04-14  
**Status:** Active frontend integrated with the current backend API

## Overview

The frontend is a React 18 + TypeScript + Vite application that powers the marketplace, auth, profile, admin, chat, and settings experiences for TijarahJo.

This document is a current-state snapshot, not a historical completion report. For canonical technical details, use:

- `apps/web/README.md`
- `docs/frontend/README.md`
- `docs/frontend/AUTH_RUNTIME_QA_MATRIX.md`
- `docs/reports/API_ENDPOINTS_STATUS.md`

## Current Architecture

The active frontend follows the current repo structure under `apps/web/src/`:

- `app/` for bootstrap, route composition, and app shell
- `features/` for domain slices such as auth, marketplace, chat, admin, profile, and settings
- `shared/` for UI primitives, helpers, and reusable hooks
- `services/` for API and realtime integrations
- `contexts/` for auth, app settings, search, and user profile state

## Implemented Capability Areas

- Marketplace browsing, search, category pages, favorites, and post details
- Auth flows including login, signup, Google OAuth initiation, password reset, and 2FA support
- Cookie-backed session handling with quiet revalidation on signed-in refresh
- Profile editing and seller profile pages
- Real-time chat and notifications
- Admin area for moderation, analytics, locations, banners, permissions, reviews, and comments
- English/Arabic support with RTL handling
- Dark mode and responsive layouts

## Current Runtime Notes

- Frontend local dev URL: `http://localhost:5173`
- Canonical backend API base URL: `http://localhost:5033/api/v1`
- Production web Docker build uses `VITE_API_BASE_URL=/api`
- Session recovery uses cookie-backed JWT auth plus `/api/v1/auth/refresh`
- Signed-in hard refresh should keep the page shell visible without flashing a logged-out header state

## Current Quality Signals

- Production build path is active through `npm run build`
- Unit, integration, policy, and browser E2E entry points exist under `apps/web/tests/`
- Storybook/workflow and UI governance checks exist under `apps/web/docs/` and `apps/web/tools/`

## Known Ongoing Work

- Launch hardening is still tracked separately in `docs/checklists/LAUNCH_READINESS_CHECKLIST.md`
- Production deployment and infrastructure guidance lives under `docs/setup/`
- API/runtime contract updates should be reflected in `docs/reports/API_ENDPOINTS_STATUS.md`

## Summary

The frontend should be treated as an active integrated application, not a mock-only prototype. Older reports that mention mock-mode setup, disconnected backend flows, or legacy frontend paths are no longer current.
