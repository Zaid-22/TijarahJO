# TijarahJo ID System Documentation

> [!WARNING]
> **Legacy Document — Historical Reference Only**
>
> This document originally described a frontend string-based ID system (`user_timestamp_random`, `post_timestamp_random`, etc.) that was planned during early development.
>
> **The backend database uses integer primary keys for all entities** (e.g., `UserID INT IDENTITY`, `PostID INT IDENTITY`). The string-based ID system described below was never adopted in the production API.

## Current ID Model

- All entities use **integer primary keys** (`INT IDENTITY`) assigned by SQL Server.
- The frontend receives and sends integer IDs through the API service layer.
- See `docs/DATABASE.md` for the canonical schema with all table PKs.

## Historical Context

The original plan used string-based prefixed IDs (e.g., `user_1734600000000_a1b2c`) for frontend mock data during early prototyping. When the real backend was built, integer PKs were adopted instead. Some legacy mock data files or test fixtures may still reference the old format.

## References

- **Current database schema**: `docs/DATABASE.md`
- **Backend API README**: `apps/api/README.md`
- **Entity configurations**: `apps/api/src/Infrastructure/Data/Configurations/`

---

**Last Updated**: 2026-05-30
**Status**: 📦 Archived — kept for historical reference only
