# Database Architecture

The TijarahJo database uses a fully normalized relational schema deployed on SQL Server. This document serves as the canonical reference for the database design.

> **Note:** The older diagram files (`docs/assets/diagrams/ER TijarahJo.png`, `TijarahJo ER.erdplus`) represent the historical prototype schema (which only had ~4 tables) and are kept for historical reference only. This document contains the current, living schema.

## Entity Relationship Diagram

The following ER diagram maps all current database tables, their primary/foreign keys, and their relationships:

```mermaid
erDiagram
    %% ==========================================
    %% Core Entities & Auth
    %% ==========================================
    Users {
        int UserID PK "IDENTITY"
        nvarchar HashedPassword
        nvarchar Email "UNIQUE"
        nvarchar FirstName
        nvarchar LastName
        nvarchar Phone
        int CityID FK
        int AreaID FK
        nvarchar Bio
        nvarchar Avatar
        datetime2 JoinDate
        datetime2 UpdatedAt
        int Status FK "Ref: UserStatusLookup"
        int RoleID FK "Ref: Roles"
        bit IsDeleted
        bit TwoFactorEnabled
        nvarchar TwoFactorSecret
        nvarchar TwoFactorPendingSecret
        nvarchar SearchFirstNameNormalized "PERSISTED"
        nvarchar SearchLastNameNormalized "PERSISTED"
        nvarchar SearchFullNameNormalized "PERSISTED"
    }

    Roles {
        int RoleID PK "IDENTITY"
        nvarchar RoleName "UNIQUE"
        datetime2 CreatedAt
        bit IsDeleted
    }

    UserExternalIdentities {
        int UserExternalIdentityID PK "IDENTITY"
        int UserID FK
        nvarchar Provider
        nvarchar ProviderSubject
        nvarchar ProviderEmail
        datetime2 CreatedAt
        datetime2 UpdatedAt
    }

    BlacklistedTokens {
        nvarchar Jti PK
        datetime2 ExpiresAt
    }

    VerificationChallenges {
        nvarchar TokenHash PK
        int UserID FK
        nvarchar Purpose
        datetime2 ExpiresAt
        nvarchar StateData "JSON"
    }

    %% ==========================================
    %% RBAC / Permissions
    %% ==========================================
    Permissions {
        int PermissionID PK "IDENTITY"
        nvarchar PermissionKey "UNIQUE"
        nvarchar Description
        nvarchar Category
    }

    RolePermissions {
        int RolePermissionID PK "IDENTITY"
        int RoleID FK
        int PermissionID FK
    }

    %% ==========================================
    %% Lookups & Classifications
    %% ==========================================
    UserStatusLookup {
        int StatusID PK
        nvarchar Code "UNIQUE"
        nvarchar StatusName "UNIQUE"
        bit IsActive
        nvarchar Description
    }

    PostStatusLookup {
        int StatusID PK
        nvarchar Code "UNIQUE"
        nvarchar StatusName "UNIQUE"
        bit IsVisible
        nvarchar Description
    }

    Cities {
        int CityID PK "IDENTITY"
        nvarchar CityName "UNIQUE"
    }

    Areas {
        int AreaID PK "IDENTITY"
        int CityID FK
        nvarchar AreaName
    }

    Categories {
        int CategoryID PK "IDENTITY"
        nvarchar CategoryName "UNIQUE"
        nvarchar NameAr
        nvarchar Image
        datetime2 CreatedAt
        bit IsDeleted
        nvarchar SearchCategoryNameNormalized "PERSISTED"
    }

    %% ==========================================
    %% Marketplace Core
    %% ==========================================
    Posts {
        int PostID PK "IDENTITY"
        int UserID FK
        int CategoryID FK
        nvarchar PostTitle
        nvarchar PostDescription
        decimal Price
        int Status FK "Ref: PostStatusLookup"
        datetime2 CreatedAt
        datetime2 UpdatedAt
        bit IsDeleted
        bigint Views
        int CityID FK
        int AreaID FK
        nvarchar SearchTitleNormalized "PERSISTED"
        nvarchar SearchDescriptionPrefixNormalized "PERSISTED"
    }

    PostImages {
        int PostImageID PK "IDENTITY"
        int PostID FK
        nvarchar PostImageURL
        datetime2 UploadedAt
        bit IsDeleted
    }

    Favorites {
        int FavoriteID PK "IDENTITY"
        int UserID FK
        int PostID FK
        datetime2 CreatedAt
        bit IsDeleted
    }

    Reviews {
        int ReviewID PK "IDENTITY"
        int ReviewerID FK
        int ReviewedUserID FK
        int Rating "CHECK 1-5"
        nvarchar Comment
        datetime2 CreatedAt
        bit IsDeleted
    }

    %% ==========================================
    %% Messaging & Chat
    %% ==========================================
    Conversations {
        int ConversationID PK "IDENTITY"
        int User1ID FK "Always lower UserID"
        int User2ID FK "Always higher UserID"
        int PostID FK "Optional reference"
        datetime2 LastMessageAt
        bit IsDeleted
    }

    Messages {
        int MessageID PK "IDENTITY"
        int SenderID FK
        int ReceiverID FK
        int ConversationID FK
        nvarchar Content
        datetime2 CreatedAt
        bit IsRead
        bit IsDeleted
    }

    %% ==========================================
    %% Notifications & System
    %% ==========================================
    Notifications {
        int NotificationID PK "IDENTITY"
        int UserID FK
        nvarchar NotificationType
        nvarchar Title
        nvarchar Body
        int SenderUserID FK
        int ConversationID FK
        int MessageID FK
        nvarchar RouteUrl
        bit IsRead
        datetime2 CreatedAt
        datetime2 ReadAt
        nvarchar PayloadJson
    %% ==========================================
    %% Moderation & Audit
    %% ==========================================
    Reports {
        int ReportID PK "IDENTITY"
        nvarchar ReportType "LISTING|USER|REVIEW|COMMENT"
        int TargetID
        nvarchar Reason
        nvarchar Description
        int ReporterUserID FK
        int Status "0=Pending, 1=InReview, 2=Resolved, 3=Dismissed"
        int ResolvedByUserID FK
        nvarchar ResolutionNotes
        datetime2 CreatedAt
        datetime2 ResolvedAt
    }

    AuditLog {
        bigint AuditLogID PK "IDENTITY"
        nvarchar TableName
        int RecordID
        nvarchar Action "INSERT|UPDATE|DELETE"
        int ChangedByUserID FK
        datetime2 ChangedAt
        nvarchar OldValues "JSON"
        nvarchar NewValues "JSON"
    }

    SystemSettings {
        int SettingID PK "IDENTITY"
        nvarchar SettingKey "UNIQUE"
        nvarchar Label
        nvarchar Value
        nvarchar ValueType "bool|int|string|json"
        nvarchar Description
        datetime2 UpdatedAt
    }

    SchemaMigrations {
        nvarchar ScriptName PK
        datetime2 AppliedAt
        nvarchar Notes
    }

    %% ==========================================
    %% Relationships definition
    %% ==========================================
    
    %% Auth / Core
    Roles ||--o{ Users : "assigns"
    UserStatusLookup ||--o{ Users : "status of"
    Users ||--o{ UserExternalIdentities : "logs in via"
    Users ||--o{ VerificationChallenges: "has"
    
    %% RBAC
    Roles ||--o{ RolePermissions : "has"
    Permissions ||--o{ RolePermissions : "mapped to"

    %% Location
    Cities ||--o{ Areas : "contains"
    Cities ||--o{ Users : "lives in"
    Areas ||--o{ Users : "lives in"
    Cities ||--o{ Posts : "located in"
    Areas ||--o{ Posts : "located in"
    
    %% Marketplace Core
    Users ||--o{ Posts : "creates"
    Categories ||--o{ Posts : "categorizes"
    PostStatusLookup ||--o{ Posts : "status of"
    Posts ||--o{ PostImages : "contains"
    
    %% Users interactions
    Users ||--o{ Favorites : "adds to wishlist"
    Posts ||--o{ Favorites : "wishlisted by"
    Users ||--o{ Reviews : "authors (Reviewer)"
    Users ||--o{ Reviews : "receives (ReviewedUser)"
    
    %% Chat System
    Users ||--o{ Conversations : "participates (User1)"
    Users ||--o{ Conversations : "participates (User2)"
    Posts |o--o{ Conversations : "discussed in"
    Conversations ||--o{ Messages : "contains"
    Users ||--o{ Messages : "sends (Sender)"
    Users ||--o{ Messages : "receives (Receiver)"

    %% Notifications
    Users ||--o{ Notifications : "receives"
    Users |o--o{ Notifications : "triggers (Sender)"
    Conversations |o--o{ Notifications : "related to"
    Messages |o--o{ Notifications : "related to"

    %% Moderation & System
    Users ||--o{ Reports : "submits (Reporter)"
    Users |o--o{ Reports : "resolves (Resolver)"
    Users |o--o{ AuditLog : "did action"

```

## Key Schema Enforcement Notes

- **Deletions**: The system implements **soft deletes** everywhere via the `IsDeleted` BIT column. (e.g., `Users`, `Posts`, `Reviews`, `Messages`, `Conversations`, `PostImages`, `Favorites`).
- **Locational Integrity**: Multi-column foreign keys (`AreaID, CityID` referencing `Areas(AreaID, CityID)`) strictly enforce that an `Area` genuinely belongs to the `City` assigned to the User/Post.
- **Constraints over Statuses**: Both Users and Posts rely on Lookup tables (`UserStatusLookup`, `PostStatusLookup`) for status values rather than inline CHECK constraints, treating the lookup tables as the single source of truth.
- **Ordered Pairs in Chat**: `Conversations` guarantees exactly ONE thread between two users per context by enforcing `User1ID < User2ID` and maintaining a UNIQUE constraint across `(User1ID, User2ID, PostID)`.
- **Search Optimization**: All critical searching text fields use database-level `PERSISTED` computed Normalized columns to maintain consistent casing, trimming, and spacing (e.g. `SearchTitleNormalized`, `SearchFullNameNormalized`).

## Auth Persistence Notes

- `BlacklistedTokens` stores revoked JWT `jti` values so logout and forced invalidation can block previously issued cookies.
- `VerificationChallenges` stores hashed verification state for flows such as login challenges, setup confirmation, and password reset verification.
- There is no active `RefreshTokens` table in the current schema; session renewal is handled through the authenticated `/api/v1/auth/refresh` path plus JWT cookie rotation and blacklisting.

## Data Lifecycle Conventions

### Soft-Delete Strategy

All user-facing entities use an `IsDeleted BIT` flag for soft deletion. Hard-delete is **never** used on user content — it is reserved exclusively for transient/security data:

| Table | Deletion Type | Rationale |
|-------|--------------|-----------|
| `BlacklistedTokens` | **Hard DELETE** | Expired JWTs have zero value; rows purged by `DataCleanupBackgroundService` |
| `VerificationChallenges` | **Hard DELETE** | Expired 2FA/reset codes; purged automatically |
| Everything else | **Soft DELETE** (`IsDeleted = 1`) | Audit trail, undo capability, legal compliance |

### Cascade Soft-Delete Rules

When a parent entity is soft-deleted, its dependent children are cascade-soft-deleted in the same transaction:

| Parent | Children Cascaded |
|--------|-------------------|
| `Posts.IsDeleted → 1` | `PostImages.IsDeleted → 1`, `Favorites.IsDeleted → 1` |

**Conversations referencing deleted Posts:** `Conversations.PostID` retains the stale reference intentionally. Nullifying it would lose "what item were we discussing?" context in the chat UI.

### Background Data Cleanup (`DataCleanupBackgroundService`)

Runs every **6 hours** with a 2-minute startup delay. Performs:

1. **Purge expired `BlacklistedTokens`** — hard DELETE where `ExpiresAt ≤ now`
2. **Purge expired `VerificationChallenges`** — hard DELETE where `ExpiresAt < now`
3. **Soft-delete stale `Notifications`** — SET `IsDeleted = 1` where `IsRead = 1` AND `ReadAt < 30 days ago`

All deletes use batch processing (1000 rows/batch) to avoid lock escalation.

### Polymorphic FK: Reports.TargetID

`Reports.TargetID` is a polymorphic foreign key — its meaning depends on `ReportType`:

| ReportType | TargetID references |
|------------|---------------------|
| `LISTING` | `Posts.PostID` |
| `USER` | `Users.UserID` |
| `REVIEW` | `Reviews.ReviewID` |
| `COMMENT` | `PostComments.CommentID` |

Referential integrity for `TargetID` is enforced at the **application level**, not the database. This is a documented trade-off: adding separate nullable FK columns would require a schema migration with data mapping, while the current pattern works safely because only the admin panel reads reports.

### Messages.ReceiverID — Intentional Denormalization

`Messages.ReceiverID` is technically derivable from `Conversations` (`User1ID + User2ID - SenderID`). It is kept as an intentional denormalization for:
- Trigger validation (`TR_Messages_ParticipantValidation` validates both sender and receiver)
- Query convenience (direct receiver lookup without JOINing Conversations)
- Notification creation (receiver is needed immediately when inserting a message)

### Column Length Caps

`NVARCHAR(MAX)` columns are capped to realistic bounded lengths to keep data in-row (SQL Server stores MAX values off-row in LOB pages when >8000 bytes):

| Table.Column | Limit | Rationale |
|-------------|-------|-----------|
| `Posts.PostDescription` | 4000 | Listing descriptions |
| `Messages.Content` | 4000 | Chat messages |
| `SystemSettings.Value` | 4000 | Config values |
| `Notifications.PayloadJson` | 2000 | Small JSON envelopes |
| `HeroBanners.ImageUrl` | 2048 | URL standard max |
| `PostImages.PostImageURL` | 2048 | URL standard max |
| `Reviews.Comment` | 4000 | Review text |
| `AuditLog.OldValues/NewValues` | MAX | JSON blobs vary widely — kept unbounded |

### SchemaMigrations Table

`dbo.SchemaMigrations` is an infrastructure-only tracking table. It has **no C# entity** and is accessed only by SQL migration scripts. Each row records a migration name and its applied timestamp to prevent re-execution.
