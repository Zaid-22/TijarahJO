# 🗂️ TijarahJo - ERD & Relational Schema Helper

> **Version**: 2.0  
> **Last Updated**: May 30, 2026  
> **Status**: Aligned with the live `TijarahJoDB` runtime schema (27 tables)  
> **Canonical schema docs**: `docs/DATABASE.md` and `apps/api/README.md`

---

## 📋 Table of Contents

1. [Overview & Methodology](#1-overview--methodology)
2. [Core & Authentication Entities](#2-core--authentication-entities)
3. [RBAC / Permissions Entities](#3-rbac--permissions-entities)
4. [Lookups & Location Entities](#4-lookups--location-entities)
5. [Marketplace Entities](#5-marketplace-entities)
6. [Communication Entities](#6-communication-entities)
7. [Moderation & System Entities](#7-moderation--system-entities)
8. [Relationships Diagram](#8-relationships-diagram)
9. [Relational Schema (3NF)](#9-relational-schema-3nf)
10. [Future Roadmap (Not Yet Built)](#10-future-roadmap-not-yet-built)

---

# 1. Overview & Methodology

## 1.1 What is TijarahJo?

TijarahJo is a **C2C (Consumer-to-Consumer) marketplace** platform similar to OLX, Dubizzle, or eBay classifieds where:
- **Sellers = Buyers = Users** (same user can sell AND buy)
- No centralized inventory (users list their own items)
- Peer-to-peer communication via real-time chat
- Platform mediates trust (reviews, verification, moderation)

## 1.2 C2C vs B2C - Key Differences

| Aspect | B2C (Amazon/Shopify) | C2C (TijarahJo/OLX) |
|--------|---------------------|---------------------|
| **Seller** | Business/Company | Individual User |
| **Inventory** | Centralized warehouse | Seller's possession |
| **Product Model** | SKU-based, quantities | Single-item listings (Posts) |
| **Pricing** | Fixed catalog prices | Negotiable per listing |
| **Order Flow** | Cart → Checkout → Ship | Inquiry → Negotiate → Transaction |
| **Trust** | Brand reputation | User reviews, verification |

## 1.3 Entity Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TijarahJo Entity Categories                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  👤 CORE/AUTH    │  │  🔑 RBAC         │  │  📍 LOOKUPS      │   │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤   │
│  │ • Users          │  │ • Roles          │  │ • Cities         │   │
│  │ • UserExternal   │  │ • Permissions    │  │ • Areas          │   │
│  │   Identities     │  │ • RolePermissions│  │ • Categories     │   │
│  │ • BlacklistedTok │  │                  │  │ • UserStatusLkp  │   │
│  │ • Verification   │  │                  │  │ • PostStatusLkp  │   │
│  │   Challenges     │  │                  │  │                  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  🏪 MARKETPLACE  │  │  💬 COMMUNICATE  │  │  🛡️ MODERATION   │   │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤   │
│  │ • Posts          │  │ • Conversations  │  │ • Reports        │   │
│  │ • PostImages     │  │ • Messages       │  │ • AuditLog       │   │
│  │ • PostComments   │  │ • Notifications  │  │ • SystemSettings │   │
│  │ • Favorites      │  │ • PushSubscript  │  │ • DataHygiene    │   │
│  │ • Reviews        │  │                  │  │ • HeroBanners    │   │
│  │                  │  │                  │  │ • SchemaMigrat   │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.4 ERD Notation Guide

| Symbol | Meaning |
|--------|---------|
| **PK** | Primary Key |
| **FK** | Foreign Key |
| **UK** | Unique Key |
| **NN** | Not Null |
| **PC** | Persisted Computed Column |
| `──────` | Identifying relationship |
| `- - - -` | Non-identifying relationship |
| `1` | One (cardinality) |
| `N` or `*` | Many (cardinality) |
| `○` | Optional participation |
| `│` | Mandatory participation |

---

# 2. Core & Authentication Entities

## 2.1 Entity: Users

> **Description**: The central entity — every person interacting with the platform. Stores auth credentials, profile info, and status. One user can be both buyer and seller.

```
┌────────────────────────────────────────────┐
│                   USERS                     │
├────────────────────────────────────────────┤
│ PK   UserID              INT IDENTITY      │
├────────────────────────────────────────────┤
│ NN   HashedPassword      NVARCHAR(500)     │ -- PBKDF2-SHA256
│ UK,NN Email              NVARCHAR(255)     │ -- Auth + unique login
│ NN   FirstName           NVARCHAR(100)     │
│      LastName            NVARCHAR(100)     │
│      Phone               NVARCHAR(20)      │
├────────────────────────────────────────────┤
│ FK   CityID              INT               │ -- → Cities (optional)
│ FK   AreaID              INT               │ -- → Areas (optional)
│      Bio                 NVARCHAR(1000)    │
│      Avatar              NVARCHAR(1000)    │ -- Profile image URL
├────────────────────────────────────────────┤
│ NN   JoinDate            DATETIME2         │
│ NN   UpdatedAt           DATETIME2         │
│ FK,NN Status             INT               │ -- → UserStatusLookup
│ FK,NN RoleID             INT               │ -- → Roles (1:N, NOT M:N)
│ NN   IsDeleted           BIT               │ -- Soft delete
├────────────────────────────────────────────┤
│ NN   TwoFactorEnabled   BIT               │
│      TwoFactorSecret     NVARCHAR(512)     │
│      TwoFactorPendingSecret NVARCHAR(512)  │
│      LastInvalidatedAt   DATETIME2         │ -- Force all JWTs invalid
│      SuspendedUntil      DATETIME2         │ -- Temporary suspension
├────────────────────────────────────────────┤
│ PC   SearchFirstNameNormalized  NVARCHAR(100)  │ -- PERSISTED computed
│ PC   SearchLastNameNormalized   NVARCHAR(100)  │ -- PERSISTED computed
│ PC   SearchFullNameNormalized   NVARCHAR(201)  │ -- PERSISTED computed
└────────────────────────────────────────────┘
```

**Key design notes:**
- **No separate Person table** — profile fields (FirstName, LastName, Phone, etc.) live directly on Users.
- **1:N with Roles** — each User has exactly one RoleID, not a many-to-many junction table.
- **Password** — PBKDF2_SHA256 hash with embedded salt (no separate salt column).
- **Search columns** — `PERSISTED` computed columns for case-insensitive, normalized search.

---

## 2.2 Entity: UserExternalIdentities

> **Description**: OAuth/social login providers linked to a user account (Google, etc.)

```
┌────────────────────────────────────────────┐
│        USER_EXTERNAL_IDENTITIES            │
├────────────────────────────────────────────┤
│ PK   UserExternalIdentityID  INT IDENTITY  │
│ FK   UserID                  INT           │ -- → Users
├────────────────────────────────────────────┤
│ NN   Provider                NVARCHAR(50)  │ -- "Google", etc.
│ NN   ProviderSubject         NVARCHAR(255) │ -- Provider's user ID
│      ProviderEmail           NVARCHAR(255) │
├────────────────────────────────────────────┤
│ NN   CreatedAt               DATETIME2     │
│ NN   UpdatedAt               DATETIME2     │
│ NN   IsDeleted               BIT           │
└────────────────────────────────────────────┘
```

---

## 2.3 Entity: BlacklistedTokens

> **Description**: Stores revoked JWT `jti` values so logout and forced invalidation can block previously issued cookies. Rows are **hard deleted** after expiry by `DataCleanupBackgroundService`.

```
┌────────────────────────────────────────────┐
│          BLACKLISTED_TOKENS                │
├────────────────────────────────────────────┤
│ PK   Jti                 NVARCHAR(450)     │ -- JWT unique ID
│ NN   ExpiresAt           DATETIME2         │ -- Hard-deleted after
└────────────────────────────────────────────┘
```

**Note:** There is **no RefreshTokens table**. Session renewal uses JWT cookie rotation plus token blacklisting via this table.

---

## 2.4 Entity: VerificationChallenges

> **Description**: Hashed verification state for login challenges, password reset, 2FA setup, and email verification flows. Rows are **hard deleted** after expiry.

```
┌────────────────────────────────────────────┐
│       VERIFICATION_CHALLENGES              │
├────────────────────────────────────────────┤
│ PK   ChallengeId         NVARCHAR(128)     │ -- Hashed token
│ NN   ChallengeType       NVARCHAR(50)      │ -- Purpose of challenge
│ FK   UserId              INT               │ -- → Users
│ NN   StateJson           NVARCHAR(MAX)     │ -- JSON state data
│ NN   ExpiresAt           DATETIME2         │
│ NN   CreatedAt           DATETIME2         │
└────────────────────────────────────────────┘
```

---

# 3. RBAC / Permissions Entities

## 3.1 Entity: Roles

> **Description**: Defines user roles. Currently two roles: `Admin` (RoleID=1) and `User` (RoleID=2). Users have a **1:N** relationship with Roles (one role per user).

```
┌────────────────────────────────────────────┐
│                  ROLES                      │
├────────────────────────────────────────────┤
│ PK   RoleID              INT IDENTITY      │
│ UK,NN RoleName           NVARCHAR(50)      │
│ NN   CreatedAt           DATETIME2         │
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘

-- Seed Data:
-- RoleID=1: Admin
-- RoleID=2: User
```

---

## 3.2 Entity: Permissions

> **Description**: Granular permission keys organized by category. Checked at the API controller level.

```
┌────────────────────────────────────────────┐
│              PERMISSIONS                    │
├────────────────────────────────────────────┤
│ PK   PermissionID        INT IDENTITY      │
│ UK,NN PermissionKey      NVARCHAR(100)     │ -- e.g. "posts.moderate"
│ NN   Description         NVARCHAR(300)     │
│ NN   Category            NVARCHAR(50)      │ -- e.g. "Posts", "Users"
└────────────────────────────────────────────┘

-- Seed Data (16 permissions):
-- Users:      users.view, users.manage
-- Posts:      posts.view, posts.moderate
-- Reviews:    reviews.view, reviews.moderate
-- Reports:    reports.view, reports.resolve
-- Content:    banners.manage
-- Locations:  locations.manage
-- System:     settings.manage, audit.view
-- Roles:      roles.manage
-- Categories: categories.manage
-- Comments:   comments.view, comments.moderate
```

---

## 3.3 Entity: RolePermissions (Junction)

> **Description**: Many-to-Many between Roles and Permissions.

```
┌────────────────────────────────────────────┐
│          ROLE_PERMISSIONS                   │
├────────────────────────────────────────────┤
│ PK   RolePermissionID    INT IDENTITY      │
│ FK   RoleID              INT               │ -- → Roles
│ FK   PermissionID        INT               │ -- → Permissions
└────────────────────────────────────────────┘
```

---

# 4. Lookups & Location Entities

## 4.1 Entity: UserStatusLookup

> **Description**: Lookup table for user account statuses. Referenced by `Users.Status` FK.

```
┌────────────────────────────────────────────┐
│          USER_STATUS_LOOKUP                 │
├────────────────────────────────────────────┤
│ PK   StatusID            INT               │
│ UK,NN Code               NVARCHAR(50)      │
│ UK,NN StatusName         NVARCHAR(50)      │
│ NN   IsActive            BIT               │
│      Description         NVARCHAR(200)     │
└────────────────────────────────────────────┘

-- Seed Data:
-- StatusID=1: ACTIVE
-- StatusID=2: BANNED
-- StatusID=3: INACTIVE
```

---

## 4.2 Entity: PostStatusLookup

> **Description**: Lookup table for post/listing statuses. Referenced by `Posts.Status` FK.

```
┌────────────────────────────────────────────┐
│          POST_STATUS_LOOKUP                 │
├────────────────────────────────────────────┤
│ PK   StatusID            INT               │
│ UK,NN Code               NVARCHAR(50)      │
│ UK,NN StatusName         NVARCHAR(50)      │
│ NN   IsVisible           BIT               │ -- Whether shown publicly
│      Description         NVARCHAR(200)     │
└────────────────────────────────────────────┘

-- Seed Data:
-- StatusID=0: ACTIVE
-- StatusID=1: BLOCKED
-- StatusID=3: SOLD
```

---

## 4.3 Entity: Cities

> **Description**: Jordanian cities. Bilingual (English + Arabic).

```
┌────────────────────────────────────────────┐
│                  CITIES                     │
├────────────────────────────────────────────┤
│ PK   CityID              INT IDENTITY      │
│ UK,NN CityName           NVARCHAR(100)     │ -- English name
│ NN   CityNameAr          NVARCHAR(100)     │ -- Arabic name
└────────────────────────────────────────────┘
```

---

## 4.4 Entity: Areas

> **Description**: Areas/districts within a city. Bilingual. Multi-column FK ensures area-city consistency.

```
┌────────────────────────────────────────────┐
│                  AREAS                      │
├────────────────────────────────────────────┤
│ PK   AreaID              INT IDENTITY      │
│ FK   CityID              INT               │ -- → Cities
│ NN   AreaName            NVARCHAR(100)     │ -- English name
│ NN   AreaNameAr          NVARCHAR(100)     │ -- Arabic name
└────────────────────────────────────────────┘
```

---

## 4.5 Entity: Categories

> **Description**: Flat category model (no parent-child hierarchy). Bilingual names with search optimization.

```
┌────────────────────────────────────────────┐
│              CATEGORIES                     │
├────────────────────────────────────────────┤
│ PK   CategoryID          INT IDENTITY      │
│ UK,NN CategoryName       NVARCHAR(100)     │ -- English name
│      NameAr              NVARCHAR(100)     │ -- Arabic name
│      Image               NVARCHAR(1000)    │ -- Category image URL
│ NN   CreatedAt           DATETIME2         │
│ NN   IsDeleted           BIT               │
├────────────────────────────────────────────┤
│ PC   SearchCategoryNameNormalized NVARCHAR(100) │ -- PERSISTED computed
└────────────────────────────────────────────┘
```

**Note:** The category model is **flat** — there is no `ParentId` self-referencing column or hierarchical nesting.

---

# 5. Marketplace Entities

## 5.1 Entity: Posts

> **Description**: The core marketplace listing — what users sell. Each post belongs to one user and one category.

```
┌────────────────────────────────────────────┐
│                  POSTS                      │
├────────────────────────────────────────────┤
│ PK   PostID              INT IDENTITY      │
│ FK   UserID              INT               │ -- → Users (who posted)
│ FK   CategoryID          INT               │ -- → Categories
├────────────────────────────────────────────┤
│ NN   PostTitle           NVARCHAR(200)     │
│      PostDescription     NVARCHAR(4000)    │
│      Price               DECIMAL           │
├────────────────────────────────────────────┤
│ FK,NN Status             INT               │ -- → PostStatusLookup
│ NN   CreatedAt           DATETIME2         │
│ NN   UpdatedAt           DATETIME2         │
│ NN   IsDeleted           BIT               │ -- Soft delete
│ NN   Views               BIGINT            │ -- View counter
├────────────────────────────────────────────┤
│ FK   CityID              INT               │ -- → Cities (optional)
│ FK   AreaID              INT               │ -- → Areas (optional)
├────────────────────────────────────────────┤
│ PC   SearchTitleNormalized              NVARCHAR(200)  │ -- PERSISTED
│ PC   SearchDescriptionPrefixNormalized  NVARCHAR(450)  │ -- PERSISTED
└────────────────────────────────────────────┘
```

**Naming note:** In this codebase, "Post" = "Listing". The term "Post" is used throughout the database and backend, while user-facing UI may say "listing" or "إعلان".

---

## 5.2 Entity: PostImages

> **Description**: Images for a post (1 Post → Many Images). Soft-deleted when parent post is soft-deleted.

```
┌────────────────────────────────────────────┐
│              POST_IMAGES                    │
├────────────────────────────────────────────┤
│ PK   PostImageID         INT IDENTITY      │
│ FK   PostID              INT               │ -- → Posts
├────────────────────────────────────────────┤
│ NN   PostImageURL        NVARCHAR(2048)    │ -- Image URL
│ NN   UploadedAt          DATETIME2         │
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘
```

---

## 5.3 Entity: PostComments

> **Description**: Threaded comments on posts. Self-referencing `ParentCommentID` enables nested replies.

```
┌────────────────────────────────────────────┐
│            POST_COMMENTS                    │
├────────────────────────────────────────────┤
│ PK   CommentID           INT IDENTITY      │
│ FK   PostID              INT               │ -- → Posts
│ FK   UserID              INT               │ -- → Users (author)
│ FK   ParentCommentID     INT               │ -- → PostComments (self-ref, NULL = root)
├────────────────────────────────────────────┤
│ NN   Content             NVARCHAR(2000)    │
│ NN   CreatedAt           DATETIME2         │
│ NN   UpdatedAt           DATETIME2         │
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘
```

---

## 5.4 Entity: Favorites

> **Description**: User wishlists/favorites. Soft-deleted when parent post is soft-deleted.

```
┌────────────────────────────────────────────┐
│              FAVORITES                      │
├────────────────────────────────────────────┤
│ PK   FavoriteID          INT IDENTITY      │
│ FK   UserID              INT               │ -- → Users
│ FK   PostID              INT               │ -- → Posts
│ NN   CreatedAt           DATETIME2         │
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘
```

---

## 5.5 Entity: Reviews

> **Description**: User-to-user reviews (not product reviews). Any user can review any other user after interacting with them.

```
┌────────────────────────────────────────────┐
│               REVIEWS                       │
├────────────────────────────────────────────┤
│ PK   ReviewID            INT IDENTITY      │
│ FK   ReviewerID          INT               │ -- → Users (who wrote)
│ FK   ReviewedUserID      INT               │ -- → Users (who is reviewed)
├────────────────────────────────────────────┤
│ NN   Rating              INT               │ -- CHECK 1-5
│      Comment             NVARCHAR(4000)    │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘
```

**Note:** Reviews are **user-to-user**, not linked to a Transaction entity. There is no TransactionId FK.

---

# 6. Communication Entities

## 6.1 Entity: Conversations

> **Description**: Chat thread between two users. Uses an ordered-pair constraint (`User1ID < User2ID`) to guarantee exactly one conversation between any two users per context.

```
┌────────────────────────────────────────────┐
│            CONVERSATIONS                    │
├────────────────────────────────────────────┤
│ PK   ConversationID      INT IDENTITY      │
│ FK   User1ID             INT               │ -- → Users (lower UserID)
│ FK   User2ID             INT               │ -- → Users (higher UserID)
│ FK   PostID              INT               │ -- → Posts (optional context)
├────────────────────────────────────────────┤
│      LastMessageAt       DATETIME2         │ -- Denormalized
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘

-- Constraint: User1ID < User2ID (ordered pair)
-- UK: (User1ID, User2ID, PostID) — one convo per pair per post
```

**Design note:** Fields are `User1ID`/`User2ID` (ordered pair), **not** `BuyerId`/`SellerId`. The lower UserID is always `User1ID`.

---

## 6.2 Entity: Messages

> **Description**: Individual messages within a conversation. Includes intentional `ReceiverID` denormalization.

```
┌────────────────────────────────────────────┐
│               MESSAGES                      │
├────────────────────────────────────────────┤
│ PK   MessageID           INT IDENTITY      │
│ FK   SenderID            INT               │ -- → Users (who sent)
│ FK   ReceiverID          INT               │ -- → Users (intentional denorm)
│ FK   ConversationID      INT               │ -- → Conversations
├────────────────────────────────────────────┤
│ NN   Content             NVARCHAR(4000)    │
│ NN   CreatedAt           DATETIME2         │
│ NN   IsRead              BIT               │
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘
```

**Why `ReceiverID`?** It's technically derivable from Conversations (`User1ID + User2ID - SenderID`), but kept for:
- Trigger validation (`TR_Messages_ParticipantValidation`)
- Direct receiver lookup without JOINing Conversations
- Notification creation (receiver needed immediately)

---

## 6.3 Entity: Notifications

> **Description**: In-app and push notifications. Links back to conversation/message context for navigation.

```
┌────────────────────────────────────────────┐
│            NOTIFICATIONS                    │
├────────────────────────────────────────────┤
│ PK   NotificationID      INT IDENTITY      │
│ FK   UserID              INT               │ -- → Users (recipient)
├────────────────────────────────────────────┤
│ NN   NotificationType    NVARCHAR(50)      │ -- "NEW_MESSAGE", etc.
│ NN   Title               NVARCHAR(200)     │
│ NN   Body                NVARCHAR(1000)    │
├────────────────────────────────────────────┤
│ FK   SenderUserID        INT               │ -- → Users (optional trigger)
│ FK   ConversationID      INT               │ -- → Conversations (optional)
│ FK   MessageID           INT               │ -- → Messages (optional)
│      RouteUrl            NVARCHAR(300)     │ -- Frontend route to open
├────────────────────────────────────────────┤
│ NN   IsRead              BIT               │
│ NN   CreatedAt           DATETIME2         │
│      ReadAt              DATETIME2         │
│      PayloadJson         NVARCHAR(2000)    │ -- Extra JSON data
│ NN   IsDeleted           BIT               │
└────────────────────────────────────────────┘
```

---

## 6.4 Entity: PushSubscriptions

> **Description**: Web Push API subscriptions for browser push notifications. Tracks delivery success/failure.

```
┌────────────────────────────────────────────┐
│          PUSH_SUBSCRIPTIONS                 │
├────────────────────────────────────────────┤
│ PK   PushSubscriptionID  INT IDENTITY      │
│ FK   UserID              INT               │ -- → Users
├────────────────────────────────────────────┤
│ NN   Endpoint            NVARCHAR(1000)    │ -- Push service URL
│      EndpointHash        BINARY(32)        │ -- SHA-256 for dedup
│ NN   P256DH              NVARCHAR(255)     │ -- Public key
│ NN   Auth                NVARCHAR(255)     │ -- Auth secret
│      UserAgent           NVARCHAR(500)     │
├────────────────────────────────────────────┤
│ NN   IsActive            BIT               │
│ NN   CreatedAt           DATETIME2         │
│ NN   UpdatedAt           DATETIME2         │
│      LastSuccessAt       DATETIME2         │
│      LastFailureAt       DATETIME2         │
│      LastFailureReason   NVARCHAR(400)     │
└────────────────────────────────────────────┘
```

---

# 7. Moderation & System Entities

## 7.1 Entity: Reports

> **Description**: Users report posts, users, reviews, or comments. Polymorphic FK pattern — `TargetID` meaning depends on `ReportType`.

```
┌────────────────────────────────────────────┐
│                REPORTS                      │
├────────────────────────────────────────────┤
│ PK   ReportID            INT IDENTITY      │
│ NN   ReportType          NVARCHAR(20)      │ -- "LISTING"|"USER"|"REVIEW"|"COMMENT"
│ NN   TargetID            INT               │ -- Polymorphic FK (see below)
├────────────────────────────────────────────┤
│ NN   Reason              NVARCHAR(50)      │ -- "SPAM","SCAM","OFFENSIVE", etc.
│      Description         NVARCHAR(2000)    │ -- Optional details
│ FK   ReporterUserID      INT               │ -- → Users (who reported)
├────────────────────────────────────────────┤
│ NN   Status              INT               │ -- 0=Pending,1=InReview,2=Resolved,3=Dismissed
│ FK   ResolvedByUserID    INT               │ -- → Users (admin who handled)
│      ResolutionNotes     NVARCHAR(1000)    │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      ResolvedAt          DATETIME2         │
└────────────────────────────────────────────┘
```

**Polymorphic FK mapping:**

| ReportType | TargetID references |
|------------|---------------------|
| `LISTING` | `Posts.PostID` |
| `USER` | `Users.UserID` |
| `REVIEW` | `Reviews.ReviewID` |
| `COMMENT` | `PostComments.CommentID` |

Referential integrity for `TargetID` is enforced at the **application level**, not the database.

---

## 7.2 Entity: AuditLog

> **Description**: Tracks all admin and system data modifications for compliance and debugging.

```
┌────────────────────────────────────────────┐
│              AUDIT_LOG                      │
├────────────────────────────────────────────┤
│ PK   AuditLogID          BIGINT IDENTITY   │
│ NN   TableName           NVARCHAR(100)     │
│ NN   RecordID            INT               │
│ NN   Action              NVARCHAR(10)      │ -- "INSERT"|"UPDATE"|"DELETE"
│ FK   ChangedByUserID     INT               │ -- → Users (nullable for system)
│ NN   ChangedAt           DATETIME2         │
│      OldValues           NVARCHAR(MAX)     │ -- JSON snapshot before
│      NewValues           NVARCHAR(MAX)     │ -- JSON snapshot after
└────────────────────────────────────────────┘
```

---

## 7.3 Entity: SystemSettings

> **Description**: Key-value configuration store for admin-managed system settings.

```
┌────────────────────────────────────────────┐
│           SYSTEM_SETTINGS                   │
├────────────────────────────────────────────┤
│ PK   SettingID           INT IDENTITY      │
│ UK,NN SettingKey         NVARCHAR(100)     │ -- "maintenance_mode", etc.
│ NN   Label               NVARCHAR(200)     │
│ NN   Value               NVARCHAR(4000)    │
│ NN   ValueType           NVARCHAR(20)      │ -- "bool"|"int"|"string"|"json"
│      Description         NVARCHAR(500)     │
│ NN   UpdatedAt           DATETIME2         │
└────────────────────────────────────────────┘
```

---

## 7.4 Entity: HeroBanners

> **Description**: Admin-managed homepage hero carousel banners. Fully bilingual (English + Arabic).

```
┌────────────────────────────────────────────┐
│            HERO_BANNERS                     │
├────────────────────────────────────────────┤
│ PK   BannerID            INT IDENTITY      │
├────────────────────────────────────────────┤
│ NN   Title               NVARCHAR(200)     │
│ NN   TitleAr             NVARCHAR(200)     │
│ NN   Subtitle            NVARCHAR(400)     │
│ NN   SubtitleAr          NVARCHAR(400)     │
│ NN   ButtonText          NVARCHAR(100)     │
│ NN   ButtonTextAr        NVARCHAR(100)     │
├────────────────────────────────────────────┤
│ NN   ImageUrl            NVARCHAR(2048)    │
│ NN   BgClass             NVARCHAR(200)     │ -- CSS gradient class
│ NN   TextClass           NVARCHAR(200)     │ -- CSS text class
│ NN   AltText             NVARCHAR(200)     │
│ NN   AltTextAr           NVARCHAR(200)     │
│      LinkUrl             NVARCHAR(500)     │ -- Optional CTA link
├────────────────────────────────────────────┤
│ NN   IsActive            BIT               │
│ NN   DisplayOrder        INT               │
│ NN   CreatedAt           DATETIME2         │
│ NN   UpdatedAt           DATETIME2         │
└────────────────────────────────────────────┘
```

---

## 7.5 Entity: DataHygieneLog

> **Description**: Infrastructure table tracking background data cleanup cycle findings and actions.

```
┌────────────────────────────────────────────┐
│          DATA_HYGIENE_LOG                   │
├────────────────────────────────────────────┤
│ PK   HygieneLogID       BIGINT IDENTITY   │
│ NN   CycleID            UNIQUEIDENTIFIER  │ -- Groups one cleanup run
│ NN   TableName          NVARCHAR(128)     │
│ NN   FindingType        NVARCHAR(50)      │
│ NN   Classification     NVARCHAR(50)      │
│ NN   AffectedRowCount   INT               │
│      SampleData         NVARCHAR(1000)    │
│ NN   Phase              INT               │
│ NN   ActionTaken        NVARCHAR(50)      │
│ NN   DetectedAt         DATETIME2         │
│      ActionedAt         DATETIME2         │
│      Notes              NVARCHAR(2000)    │
└────────────────────────────────────────────┘
```

---

## 7.6 Entity: SchemaMigrations

> **Description**: Infrastructure-only tracking table. No C# entity — accessed only by SQL migration scripts.

```
┌────────────────────────────────────────────┐
│          SCHEMA_MIGRATIONS                  │
├────────────────────────────────────────────┤
│ PK   ScriptName          NVARCHAR(255)     │ -- Migration file name
│ NN   AppliedAt           DATETIME2         │
│      Notes               NVARCHAR(500)     │
└────────────────────────────────────────────┘
```

---

# 8. Relationships Diagram

## 8.1 Core/Auth & RBAC Relationships

```
┌──────────────────┐          ┌────────────┐
│ UserStatusLookup │ 1──────N │            │
└──────────────────┘          │            │
                              │   Users    │
┌──────────────────┐          │            │
│      Roles       │ 1──────N │            │
└──────────────────┘          └────────────┘
       │ 1                          │ 1
       │                            │
       ▼ N                          ├────────────────────┐
┌──────────────────┐                ▼ N                  ▼ N
│ RolePermissions  │         ┌──────────────┐    ┌──────────────────┐
└──────────────────┘         │  UserExternal │    │  Verification    │
       │ N                   │  Identities   │    │  Challenges      │
       │                     └──────────────┘    └──────────────────┘
       ▼ 1
┌──────────────────┐
│   Permissions    │
└──────────────────┘
```

## 8.2 Location Relationships

```
┌────────────┐
│   Cities   │
└────────────┘
       │ 1
       │
       ├────────────────────────────┐
       ▼ N                         │
┌────────────┐                     │
│   Areas    │                     │
└────────────┘                     │
       │ 1                         │ 1
       │                           │
       ├──────────┐                ├──────────┐
       ▼ N        ▼ N             ▼ N        ▼ N
  ┌────────┐  ┌────────┐    ┌────────┐  ┌────────┐
  │ Users  │  │ Posts   │    │ Users  │  │ Posts   │
  │(AreaID)│  │(AreaID) │    │(CityID)│  │(CityID) │
  └────────┘  └────────┘    └────────┘  └────────┘
```

## 8.3 Marketplace Relationships

```
                           ┌────────────┐
                           │ Categories │
                           └────────────┘
                                 │ 1
                                 │
                                 ▼ N
   ┌────────┐   1          ┌────────────┐
   │ Users  │──────────N──▶│   Posts     │
   └────────┘              └────────────┘
                                 │ 1
                                 │
                ┌────────┬───────┼────────┐
                ▼ N      ▼ N    ▼ N      ▼ N
          ┌──────────┐┌──────┐┌────────┐┌────────────┐
          │PostImages││Favor ││Post    ││Conversations│
          └──────────┘│ites  ││Comments││(PostID opt) │
                      └──────┘└────────┘└────────────┘
                                  │
                                  │ (Self-ref: ParentCommentID)
                                  ▼
                            ┌────────────┐
                            │PostComments│ (Threaded replies)
                            └────────────┘
```

## 8.4 Communication Flow

```
┌────────┐               ┌────────────┐               ┌────────┐
│ User1  │──────────────▶│Conversation│◀──────────────│ User2  │
│ (lower │  User1ID      │(ordered    │  User2ID      │(higher │
│ UserID)│               │   pair)    │               │ UserID)│
└────────┘               └────────────┘               └────────┘
     │                         │ 1                         │
     │                         │                           │
     │                         ▼ N                         │
     │                   ┌───────────┐                     │
     └───(SenderID)─────▶│  Message  │◀──(ReceiverID)──────┘
                         └───────────┘
                               │
                               │ (triggers)
                               ▼
                         ┌──────────────┐
                         │ Notification │
                         └──────────────┘
                               │
                               │ (optional)
                               ▼
                         ┌──────────────────┐
                         │PushSubscriptions │ (browser push)
                         └──────────────────┘

     ┌────────┐                              ┌────────┐
     │ User A │──────────(ReviewerID)───────▶│ Review │
     └────────┘                              └────────┘
     ┌────────┐                                  │
     │ User B │◀────(ReviewedUserID)─────────────┘
     └────────┘
```

## 8.5 Complete Relationship Matrix

| Entity A | Relationship | Entity B | Cardinality | FK Column |
|----------|--------------|----------|-------------|-----------|
| Roles | assigns | Users | 1:N | Users.RoleID |
| UserStatusLookup | status of | Users | 1:N | Users.Status |
| Users | logs in via | UserExternalIdentities | 1:N | UserExternalIdentities.UserID |
| Users | has | VerificationChallenges | 1:N | VerificationChallenges.UserId |
| Roles | has | RolePermissions | 1:N | RolePermissions.RoleID |
| Permissions | mapped to | RolePermissions | 1:N | RolePermissions.PermissionID |
| Cities | contains | Areas | 1:N | Areas.CityID |
| Cities | location of | Users | 1:N | Users.CityID |
| Areas | location of | Users | 1:N | Users.AreaID |
| Cities | location of | Posts | 1:N | Posts.CityID |
| Areas | location of | Posts | 1:N | Posts.AreaID |
| Categories | categorizes | Posts | 1:N | Posts.CategoryID |
| PostStatusLookup | status of | Posts | 1:N | Posts.Status |
| Users | creates | Posts | 1:N | Posts.UserID |
| Posts | contains | PostImages | 1:N | PostImages.PostID |
| Posts | has | PostComments | 1:N | PostComments.PostID |
| Users | writes | PostComments | 1:N | PostComments.UserID |
| PostComments | parent of | PostComments | 1:N | PostComments.ParentCommentID |
| Users | favorites | Posts (via Favorites) | N:M | Favorites.UserID, PostID |
| Users | authors | Reviews | 1:N | Reviews.ReviewerID |
| Users | receives | Reviews | 1:N | Reviews.ReviewedUserID |
| Users | participates | Conversations (User1) | 1:N | Conversations.User1ID |
| Users | participates | Conversations (User2) | 1:N | Conversations.User2ID |
| Posts | discussed in | Conversations | 1:N (opt) | Conversations.PostID |
| Conversations | contains | Messages | 1:N | Messages.ConversationID |
| Users | sends | Messages | 1:N | Messages.SenderID |
| Users | receives | Messages | 1:N | Messages.ReceiverID |
| Users | receives | Notifications | 1:N | Notifications.UserID |
| Users | triggers | Notifications | 1:N (opt) | Notifications.SenderUserID |
| Conversations | related to | Notifications | 1:N (opt) | Notifications.ConversationID |
| Messages | related to | Notifications | 1:N (opt) | Notifications.MessageID |
| Users | subscribes | PushSubscriptions | 1:N | PushSubscriptions.UserID |
| Users | submits | Reports | 1:N | Reports.ReporterUserID |
| Users | resolves | Reports | 1:N (opt) | Reports.ResolvedByUserID |
| Users | actions | AuditLog | 1:N (opt) | AuditLog.ChangedByUserID |

---

# 9. Relational Schema (3NF)

## 9.1 Summary Table

| # | Table | Description | Type |
|---|-------|-------------|------|
| 1 | Users | User accounts & profiles | Core |
| 2 | Roles | System roles (Admin, User) | RBAC |
| 3 | Permissions | Granular permission keys | RBAC |
| 4 | RolePermissions | Role ↔ Permission mapping | RBAC Junction |
| 5 | UserExternalIdentities | OAuth/social login | Auth |
| 6 | BlacklistedTokens | Revoked JWT tracking | Auth |
| 7 | VerificationChallenges | 2FA/reset verification | Auth |
| 8 | UserStatusLookup | User status codes | Lookup |
| 9 | PostStatusLookup | Post status codes | Lookup |
| 10 | Cities | Jordanian cities (bilingual) | Lookup |
| 11 | Areas | Districts within cities | Lookup |
| 12 | Categories | Post categories (bilingual) | Lookup |
| 13 | Posts | Marketplace listings | Marketplace |
| 14 | PostImages | Post photos | Marketplace |
| 15 | PostComments | Threaded post comments | Marketplace |
| 16 | Favorites | User wishlists | Marketplace |
| 17 | Reviews | User-to-user reviews | Marketplace |
| 18 | Conversations | Chat threads | Communication |
| 19 | Messages | Chat messages | Communication |
| 20 | Notifications | In-app notifications | Communication |
| 21 | PushSubscriptions | Browser push subscriptions | Communication |
| 22 | Reports | Abuse/content reports | Moderation |
| 23 | AuditLog | Change tracking | System |
| 24 | SystemSettings | Admin config store | System |
| 25 | HeroBanners | Homepage carousel | Content |
| 26 | DataHygieneLog | Cleanup cycle tracking | Infrastructure |
| 27 | SchemaMigrations | Migration tracking | Infrastructure |

## 9.2 Key Design Patterns

### Soft-Delete Strategy
All user-facing entities use `IsDeleted BIT` for soft deletion. Hard-delete is reserved for transient/security data:

| Table | Deletion Type | Rationale |
|-------|--------------|-----------|
| `BlacklistedTokens` | **Hard DELETE** | Expired JWTs; purged by background service |
| `VerificationChallenges` | **Hard DELETE** | Expired codes; purged automatically |
| Everything else | **Soft DELETE** (`IsDeleted = 1`) | Audit trail, undo, compliance |

### Cascade Soft-Delete Rules

| Parent | Children Cascaded |
|--------|-------------------|
| `Posts.IsDeleted → 1` | `PostImages.IsDeleted → 1`, `Favorites.IsDeleted → 1` |

### Polymorphic FK: Reports.TargetID
`Reports.TargetID` meaning depends on `ReportType`:

| ReportType | TargetID → | Table |
|------------|-----------|-------|
| `LISTING` | PostID | Posts |
| `USER` | UserID | Users |
| `REVIEW` | ReviewID | Reviews |
| `COMMENT` | CommentID | PostComments |

### Intentional Denormalization: Messages.ReceiverID
`ReceiverID` is derivable from Conversations but kept for trigger validation, query convenience, and notification creation.

### Search Optimization: PERSISTED Computed Columns
Critical search fields use database-level `PERSISTED` computed normalized columns:

| Table | Computed Column |
|-------|----------------|
| Users | `SearchFirstNameNormalized`, `SearchLastNameNormalized`, `SearchFullNameNormalized` |
| Posts | `SearchTitleNormalized`, `SearchDescriptionPrefixNormalized` |
| Categories | `SearchCategoryNameNormalized` |

### Locational Integrity
Multi-column FK constraints (`AreaID, CityID` referencing `Areas(AreaID, CityID)`) ensure an Area genuinely belongs to the assigned City for both Users and Posts.

### Column Length Caps
`NVARCHAR(MAX)` columns are capped to realistic bounded lengths:

| Table.Column | Limit | Rationale |
|-------------|-------|-----------|
| `Posts.PostDescription` | 4000 | Listing descriptions |
| `Messages.Content` | 4000 | Chat messages |
| `SystemSettings.Value` | 4000 | Config values |
| `Notifications.PayloadJson` | 2000 | Small JSON envelopes |
| `HeroBanners.ImageUrl` | 2048 | URL standard max |
| `PostImages.PostImageURL` | 2048 | URL standard max |
| `Reviews.Comment` | 4000 | Review text |
| `AuditLog.OldValues/NewValues` | MAX | JSON blobs vary widely |

---

# 10. Future Roadmap (Not Yet Built)

> **Note**: هذه الكيانات مخطط لها للمستقبل ولم يتم تطبيقها بعد في قاعدة البيانات الحالية.
> The following entities are planned for future phases and do **not** exist in the current database.

### Phase 2 — Transactions & Payments
- **Transaction** — Records buyer-seller agreements with agreed pricing
- **Payment** — Payment records linked to transactions (Stripe, PayPal, etc.)
- **Escrow** — Platform holds payment until transaction completes
- **Commission** — Platform fees per transaction
- **Wallet / WalletTransaction** — User balance for platform payments

### Phase 3 — Advanced Marketplace
- **CategoryAttribute** — Dynamic fields per category (e.g., Cars need "Mileage")
- **ListingAttribute** — EAV pattern for dynamic attribute values
- **SavedSearch** — Saved search queries with notification alerts
- **VIP Subscriptions** — Tiered user plans with premium features
- **Bidding/Auction System** — مع اشتراكات وضمانات

---

> **Canonical follow-up**: Use `docs/DATABASE.md` for the living ER diagram (Mermaid) and `docs/reports/API_ENDPOINTS_STATUS.md` for runtime API/auth behavior.
