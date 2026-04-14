# TijarahJo — Database ERD Documentation

## 📌 Overview

**TijarahJo** is a *Customer-to-Customer (C2C) buy/sell platform* that allows users to create accounts, publish posts to sell items, categorize listings, upload images, chat with buyers/sellers in real-time, manage favorites, and handle authentication with advanced security features (2FA, OAuth, token blacklisting).

This document provides **complete documentation** of the **Entity-Relationship Diagram (ERD)** based on the actual Domain entity models and serves as a reference for developers, database designers, and reviewers.

---

## 🗂️ ERD Scope & Design Goals

- Maintain **data normalization** and reduce redundancy
- Support **scalability** (locations, images, messages, notifications)
- Ensure **data integrity** using primary & foreign keys
- Reflect **real-world marketplace behavior**
- Support **soft-delete semantics** (`IsDeleted` flag) across entities
- Enable **audit trails** and security compliance
- Use **integer primary keys** for all entities

---

## 🧱 Entities Overview (23 Tables)

### Core Marketplace
1. **Users** — registered accounts
2. **UserPosts** — item listings
3. **PostImages** — listing photos
4. **ItemCategories** — post classification
5. **Favorites** — bookmarked posts

### Geography
6. **Cities** — Jordan cities
7. **Areas** — districts within cities

### Communication
8. **Conversations** — chat threads (user pairs)
9. **Messages** — individual chat messages

### Engagement
10. **Reviews** — seller ratings
11. **Notifications** — in-app alerts
12. **PushSubscriptions** — web push endpoints

### Security & Access Control
13. **Roles** — user roles (admin, user)
14. **Permissions** — granular permission keys
15. **RolePermissions** — role-to-permission mapping
16. **BlacklistedTokens** — revoked JWT tokens
17. **VerificationChallenges** — hashed verification state for auth challenge flows
18. **UserExternalIdentities** — OAuth provider links
19. **Reports** — abuse/fraud reports

### System
20. **AuditLog** — data mutation audit trail
21. **SystemSettings** — admin-configurable feature flags
22. **PostStatusLookup** — post status reference data
23. **UserStatusLookup** — user status reference data

---

## 👤 Entity: Users

Represents a registered user.

| Attribute | Type | Description |
|-----------|------|-------------|
| **UserID** (PK) | INT | Unique identifier |
| Email | NVARCHAR | Primary email address |
| HashedPassword | NVARCHAR | PBKDF2-SHA256 hashed password |
| FirstName | NVARCHAR | First name |
| LastName | NVARCHAR? | Last name (optional) |
| Phone | NVARCHAR? | Phone number (+962 format) |
| CityID (FK) | INT? | References `Cities.CityID` |
| AreaID (FK) | INT? | References `Areas.AreaID` |
| Bio | NVARCHAR? | User bio |
| Avatar | NVARCHAR? | Profile picture URL |
| JoinDate | DATETIME2 | Account creation timestamp |
| UpdatedAt | DATETIME2 | Last update timestamp |
| Status | INT | References `UserStatusLookup` |
| RoleID (FK) | INT | References `Roles.RoleID` |
| IsDeleted | BIT | Soft-delete flag |
| TwoFactorEnabled | BIT | Whether TOTP 2FA is active |
| TwoFactorSecret | NVARCHAR? | TOTP secret (encrypted) |
| TwoFactorPendingSecret | NVARCHAR? | Pending TOTP secret during setup |
| SearchFirstNameNormalized | NVARCHAR? | Computed search index |
| SearchLastNameNormalized | NVARCHAR? | Computed search index |
| SearchFullNameNormalized | NVARCHAR? | Computed search index |

---

## 🏙️ Entity: Cities

Jordan cities for location management.

| Attribute | Type | Description |
|-----------|------|-------------|
| **CityID** (PK) | INT | Unique city identifier |
| CityName | NVARCHAR | City name |

**Relationship:** One City → Many Areas

---

## 📍 Entity: Areas

Districts/areas within a city.

| Attribute | Type | Description |
|-----------|------|-------------|
| **AreaID** (PK) | INT | Unique area identifier |
| CityID (FK) | INT | References `Cities.CityID` |
| AreaName | NVARCHAR | Area/district name |

**Relationship:** One City → Many Areas

---

## 📝 Entity: UserPosts

Item listings posted for sale.

| Attribute | Type | Description |
|-----------|------|-------------|
| **PostID** (PK) | INT | Unique post identifier |
| UserID (FK) | INT | Owner (References `Users`) |
| CategoryID (FK) | INT | References `ItemCategories` |
| PostTitle | NVARCHAR | Listing title |
| PostDescription | NVARCHAR(MAX)? | Detailed description |
| Price | DECIMAL(18,2)? | Item price in JOD |
| Status | INT | References `PostStatusLookup` |
| CityID (FK) | INT? | Listing city |
| AreaID (FK) | INT? | Listing area |
| Views | BIGINT | View count |
| IsDeleted | BIT | Soft-delete flag |
| CreatedAt | DATETIME2 | Creation timestamp |
| UpdatedAt | DATETIME2 | Last update timestamp |
| SearchTitleNormalized | NVARCHAR? | Computed search index |
| SearchDescriptionPrefixNormalized | NVARCHAR? | Computed search index |

### Business Rules
- Only **active** status posts are visible to buyers
- Posts use `IsDeleted = 1` for soft-delete
- Status domain enforced via `PostStatusLookup`

---

## 🖼️ Entity: PostImages

Post photos (server-side file uploads).

| Attribute | Type | Description |
|-----------|------|-------------|
| **PostImageID** (PK) | INT | Unique image identifier |
| PostID (FK) | INT | References `UserPosts.PostID` |
| PostImageURL | NVARCHAR | Image storage path/URL |
| IsDeleted | BIT | Soft-delete flag |
| UploadedAt | DATETIME2 | Upload timestamp |

**Relationship:** One Post → Many Images

---

## 🗃️ Entity: ItemCategories

Post classification categories.

| Attribute | Type | Description |
|-----------|------|-------------|
| **CategoryID** (PK) | INT | Unique category ID |
| CategoryName | NVARCHAR | English name |
| NameAr | NVARCHAR? | Arabic name |
| Icon | NVARCHAR? | Icon identifier |
| Color | NVARCHAR? | Theme color |
| Image | NVARCHAR? | Category image URL |
| CreatedAt | DATETIME2 | Creation timestamp |
| IsDeleted | BIT | Soft-delete flag |
| SearchCategoryNameNormalized | NVARCHAR? | Computed search index |

**Relationship:** One Category → Many Posts

---

## ⭐ Entity: Favorites

User bookmarked posts.

| Attribute | Type | Description |
|-----------|------|-------------|
| **FavoriteID** (PK) | INT | Unique favorite ID |
| UserID (FK) | INT | References `Users` |
| PostID (FK) | INT | References `UserPosts` |
| CreatedAt | DATETIME2 | When favorited |
| IsDeleted | BIT | Soft-delete flag |

---

## 💬 Entity: Conversations

Chat threads between two users. Uses a pair model where `User1ID < User2ID` to prevent duplicate conversations.

| Attribute | Type | Description |
|-----------|------|-------------|
| **ConversationID** (PK) | INT | Unique conversation ID |
| User1ID (FK) | INT | Lower UserID in the pair |
| User2ID (FK) | INT | Higher UserID in the pair |
| PostID (FK) | INT? | Post that initiated chat |
| LastMessageAt | DATETIME2? | Most recent message time |
| IsDeleted | BIT | Soft-delete flag |

**Constraint:** `UQ_Conversations_Pair` ensures unique (User1ID, User2ID) pairs.

---

## ✉️ Entity: Messages

Individual chat messages.

| Attribute | Type | Description |
|-----------|------|-------------|
| **MessageID** (PK) | INT | Unique message ID |
| ConversationID (FK) | INT | References `Conversations` |
| SenderID (FK) | INT | References `Users.UserID` |
| Content | NVARCHAR(MAX) | Message text or image URL |
| CreatedAt | DATETIME2 | Message timestamp |
| IsRead | BIT | Read receipt |
| IsDeleted | BIT | Soft-delete flag |

**Relationship:** One Conversation → Many Messages

---

## ⭐ Entity: Reviews

Seller reviews and ratings.

| Attribute | Type | Description |
|-----------|------|-------------|
| **ReviewID** (PK) | INT | Unique review ID |
| ReviewerID (FK) | INT | User writing the review |
| ReviewedUserID (FK) | INT | User being reviewed |
| Rating | INT | Rating value |
| Comment | NVARCHAR(MAX)? | Review text |
| CreatedAt | DATETIME2 | Review timestamp |
| IsDeleted | BIT | Soft-delete flag |

---

## 🔔 Entity: Notifications

In-app notification system.

| Attribute | Type | Description |
|-----------|------|-------------|
| **NotificationID** (PK) | INT | Unique notification ID |
| UserID (FK) | INT | Target user |
| NotificationType | NVARCHAR | Type identifier |
| Title | NVARCHAR | Notification title |
| Body | NVARCHAR | Notification body |
| SenderUserID (FK) | INT? | User who triggered it |
| ConversationID (FK) | INT? | Related conversation |
| MessageID (FK) | INT? | Related message |
| RouteUrl | NVARCHAR? | Deep-link URL |
| IsRead | BIT | Read status |
| CreatedAt | DATETIME2 | Timestamp |
| ReadAt | DATETIME2? | When read |
| PayloadJson | NVARCHAR(MAX)? | Extra JSON data |

---

## 📱 Entity: PushSubscriptions

Web push notification subscriptions.

| Attribute | Type | Description |
|-----------|------|-------------|
| **PushSubscriptionID** (PK) | INT | Unique ID |
| UserID (FK) | INT | References `Users` |
| Endpoint | NVARCHAR | Push endpoint URL |
| P256DH | NVARCHAR | Public encryption key |
| Auth | NVARCHAR | Auth secret |
| UserAgent | NVARCHAR? | Client user agent |
| IsActive | BIT | Active status |
| CreatedAt | DATETIME2 | Creation time |
| UpdatedAt | DATETIME2 | Last update |
| LastSuccessAt | DATETIME2? | Last successful push |
| LastFailureAt | DATETIME2? | Last failed push |
| LastFailureReason | NVARCHAR? | Failure details |

---

## 🔐 Entity: Roles

Role-based access control.

| Attribute | Type | Description |
|-----------|------|-------------|
| **RoleID** (PK) | INT | Unique role ID |
| RoleName | NVARCHAR | Role name (`admin`, `user`) |
| CreatedAt | DATETIME2 | Creation timestamp |
| IsDeleted | BIT | Soft-delete flag |

**Relationship:** One Role → Many Users

---

## 🔑 Entity: Permissions

Granular permission keys for RBAC.

| Attribute | Type | Description |
|-----------|------|-------------|
| **PermissionID** (PK) | INT | Unique permission ID |
| PermissionKey | NVARCHAR | Key (e.g., `users.ban`, `posts.delete`) |
| Description | NVARCHAR | Human-readable description |
| Category | NVARCHAR | Grouping (`Users`, `Posts`, `System`) |

---

## 🔗 Entity: RolePermissions

Junction table mapping roles to permissions (many-to-many).

| Attribute | Type | Description |
|-----------|------|-------------|
| **RolePermissionID** (PK) | INT | Unique mapping ID |
| RoleID (FK) | INT | References `Roles` |
| PermissionID (FK) | INT | References `Permissions` |

---

## 🚫 Entity: BlacklistedTokens

Revoked JWT tokens for secure logout.

| Attribute | Type | Description |
|-----------|------|-------------|
| **Jti** (PK) | NVARCHAR(100) | JWT ID (`jti` claim) |
| ExpiresAt | DATETIME2 | Token expiration (rows past this can be purged) |

---

## ✅ Entity: VerificationChallenges

Hashed verification state for session recovery and challenge-based auth flows.

| Attribute | Type | Description |
|-----------|------|-------------|
| **TokenHash** (PK) | NVARCHAR | Hashed verification token |
| UserID (FK) | INT | References `Users` |
| Purpose | NVARCHAR | Challenge purpose (`login`, `2fa_setup`, `password_reset`, etc.) |
| ExpiresAt | DATETIME2 | Expiry timestamp |
| StateData | NVARCHAR? | JSON payload for challenge state |

**Runtime note:** The active schema uses `BlacklistedTokens` and `VerificationChallenges` for auth/session state. There is no current `RefreshTokens` table in the runtime database.

---

## 🌐 Entity: UserExternalIdentities

OAuth / social login provider links.

| Attribute | Type | Description |
|-----------|------|-------------|
| **UserExternalIdentityID** (PK) | INT | Unique ID |
| UserID (FK) | INT | References `Users` |
| Provider | NVARCHAR | Provider name (`Google`) |
| ProviderSubject | NVARCHAR | Provider user ID (sub claim) |
| ProviderEmail | NVARCHAR? | Email from provider |
| CreatedAt | DATETIME2 | Link creation time |
| UpdatedAt | DATETIME2 | Last update |

---

## 🚩 Entity: Reports

User-submitted abuse/fraud reports.

| Attribute | Type | Description |
|-----------|------|-------------|
| **ReportID** (PK) | INT | Unique report ID |
| ReportType | NVARCHAR | `LISTING`, `USER`, `REVIEW`, `CHAT` |
| TargetID | INT | ID of reported entity |
| Reason | NVARCHAR | `SPAM`, `SCAM`, `OFFENSIVE`, `FAKE`, `HARASSMENT`, `OTHER` |
| Description | NVARCHAR? | Additional details |
| ReporterUserID (FK) | INT | User filing the report |
| Status | INT | 0=Pending, 1=UnderReview, 2=Resolved, 3=Dismissed |
| ResolvedByUserID (FK) | INT? | Admin who resolved it |
| ResolutionNotes | NVARCHAR? | Admin resolution notes |
| CreatedAt | DATETIME2 | Report timestamp |
| ResolvedAt | DATETIME2? | Resolution timestamp |

---

## 📋 Entity: AuditLog

Data mutation audit trail (written in the same transaction).

| Attribute | Type | Description |
|-----------|------|-------------|
| **AuditLogID** (PK) | BIGINT | Auto-increment ID |
| TableName | NVARCHAR | Mutated table name |
| RecordID | INT | PK of affected row |
| Action | NVARCHAR | `INSERT`, `UPDATE`, `DELETE` |
| ChangedByUserID | INT? | Actor UserID (null for system) |
| ChangedAt | DATETIME2 | UTC timestamp |
| OldValues | NVARCHAR(MAX)? | JSON snapshot before change |
| NewValues | NVARCHAR(MAX)? | JSON snapshot after change |

---

## ⚙️ Entity: SystemSettings

Admin-configurable system feature flags.

| Attribute | Type | Description |
|-----------|------|-------------|
| **SettingID** (PK) | INT | Unique setting ID |
| SettingKey | NVARCHAR | Machine-readable key (e.g., `MaintenanceMode`) |
| Label | NVARCHAR | Admin panel display label |
| Value | NVARCHAR | Current value (string-serialized) |
| ValueType | NVARCHAR | Data type hint (`bool`, `string`, `int`) |
| Description | NVARCHAR? | Admin UI description |
| UpdatedAt | DATETIME2 | Last modification |

---

## 📊 Entity: PostStatusLookup

Reference table for post status codes.

| Attribute | Type | Description |
|-----------|------|-------------|
| **StatusID** (PK) | INT | Status code |
| Code | NVARCHAR | Machine-readable code |
| StatusName | NVARCHAR | Display name |
| IsVisible | BIT | Whether posts with this status are publicly visible |
| Description | NVARCHAR? | Description |

---

## 📊 Entity: UserStatusLookup

Reference table for user status codes.

| Attribute | Type | Description |
|-----------|------|-------------|
| **StatusID** (PK) | INT | Status code |
| Code | NVARCHAR | Machine-readable code |
| StatusName | NVARCHAR | Display name |
| IsActive | BIT | Whether users with this status can log in |
| Description | NVARCHAR? | Description |

---

## 🔗 Relationships Summary

| Relationship | Type |
|-------------|------|
| Cities → Areas | One-to-Many |
| Cities → Users | One-to-Many |
| Cities → UserPosts | One-to-Many |
| Areas → Users | One-to-Many |
| Areas → UserPosts | One-to-Many |
| Users → UserPosts | One-to-Many |
| Users → Favorites | One-to-Many |
| Users → Reviews (as reviewer) | One-to-Many |
| Users → Reviews (as reviewee) | One-to-Many |
| Users → Notifications | One-to-Many |
| Users → PushSubscriptions | One-to-Many |
| Users → UserExternalIdentities | One-to-Many |
| Users → Messages (as sender) | One-to-Many |
| Users → Conversations (as User1) | One-to-Many |
| Users → Conversations (as User2) | One-to-Many |
| Users → Reports (as reporter) | One-to-Many |
| Roles → Users | One-to-Many |
| Roles → RolePermissions | One-to-Many |
| Permissions → RolePermissions | One-to-Many |
| ItemCategories → UserPosts | One-to-Many |
| UserPosts → PostImages | One-to-Many |
| UserPosts → Favorites | One-to-Many |
| UserPosts → Conversations | One-to-Many |
| Conversations → Messages | One-to-Many |
| PostStatusLookup → UserPosts | One-to-Many |
| UserStatusLookup → Users | One-to-Many |

---

## 🔐 Data Integrity & Constraints

- **Primary Keys (PK)** — all use `INT` identity (except `BlacklistedTokens` which uses `NVARCHAR` Jti)
- **Foreign Keys (FK)** — enforce referential integrity
- **Unique constraints** — conversation user pairs, push subscription endpoints
- **Computed search columns** — normalized search indexes for full-text queries
- **Filtered indexes** — optimize soft-delete queries (`WHERE IsDeleted = 0`)
- **Soft-delete pattern** — `IsDeleted` flag on Users, Posts, Favorites, Messages, Reviews, Conversations, Categories, PostImages, Roles

---

## ⚙️ Design Considerations

- **Integer IDs** for all primary keys
- Normalized to **3rd Normal Form (3NF)**
- **Lookup tables** for status codes (post status, user status)
- **Conversation pair model** — `User1ID < User2ID` prevents duplicate threads
- **Audit logging** — mutations recorded in same transaction via EF Core interceptor
- `CreatedAt` / `UpdatedAt` timestamps via EF Core `UpdatedAtInterceptor`
- **23 entity tables** managed via **34 ordered migration scripts**

---

## 🛠️ Tools Used

- **ORM:** Entity Framework Core 8
- **Database:** SQL Server 2022 (Docker for local dev)
- **Migrations:** Flyway-style ordered SQL scripts (`V{timestamp}__{description}.sql`)

---

Last Updated: 2026-04-14
