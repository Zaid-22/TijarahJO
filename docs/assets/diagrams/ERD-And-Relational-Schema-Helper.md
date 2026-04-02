# 🗂️ TijarahJo - ERD & Relational Schema Helper

> **Version**: 1.0  
> **Last Updated**: April 2, 2026  
> **Status**: Historical planning helper, not the canonical runtime schema reference  
> **Canonical schema docs**: `docs/DATABASE.md` and `apps/api/README.md`

---
---
نقطة مهمة -- بعض ال Attributes قد نقول شو الفايدة منها او ليش بدنا نحطها ، لكن ليس كل شيء يتم عرضه بالفرونت ! هناك بيانات فقط For Admins, Security, Tracking, Data فإضافتها والبزنس لوجيك سهل ولكن الفائدة كبيرة
---
---

---
---
فقط قد نقوم بعمل نظام دفع لنا كليك على حساب الآدمن (اي حد فينا) في حالة اشتراك VIP 
، سنفكر بنظام التوصيل
 ونظام ال VIP
 ونظام المزايدة (مع اشتراكات وضمانات من يريد أن ينضم يوقع تعهد ويدفع ، فنضمن بذلك بالمزايدة أنه اذا وضع سعر يجب ان يكون  مثلا بالحساب مع توقيع تعهد (شروط بزنس بس))
---
---

## 📋 Table of Contents

1. [Overview & Methodology](#1-overview--methodology)
2. [Core & Authentication Entities](#2-core--authentication-entities)
3. [Marketplace Entities](#3-marketplace-entities)
4. [Transaction & Payment Entities](#4-transaction--payment-entities)
5. [Communication Entities](#5-communication-entities)
6. [Relationships Diagram](#6-relationships-diagram)
7. [Relational Schema (3NF)](#7-relational-schema-3nf)

---

# 1. Overview & Methodology

## 1.1 What is TijarahJo?

TijarahJo is a **C2C (Consumer-to-Consumer) marketplace** platform similar to OLX, Dubizzle, or eBay classifieds where:
- **Sellers = Buyers = Users** (same user can sell AND buy)
- No centralized inventory (users list their own items)
- Peer-to-peer transactions
- Platform mediates trust (reviews, verification, escrow)

## 1.2 C2C vs B2C - Key Differences

| Aspect | B2C (Amazon/Shopify) | C2C (TijarahJo/OLX) |
|--------|---------------------|---------------------|
| **Seller** | Business/Company | Individual User |
| **Inventory** | Centralized warehouse | Seller's possession |
| **Product Model** | SKU-based, quantities | Single-item listings |
| **Pricing** | Fixed catalog prices | Negotiable per listing |
| **Order Flow** | Cart → Checkout → Ship | Inquiry → Negotiate → Transaction : المعاملة → التفاوض →الطلب  |
| **Trust** | Brand reputation | User reviews, verification |
| **Payment** | Direct to platform | Escrow or platform-mediated - الضمان أو الوسيط عبر المنصة |

## 1.3 Entity Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TijarahJo Entity Categories                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  👤 CORE/AUTH    │  │  🏪 MARKETPLACE  │  │  💰 TRANSACTION  │   │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤   │
│  │ • Person         │  │ • Category       │  │ • Transaction    │   │
│  │ • User           │  │ • Listing        │  │ • Payment        │   │
│  │ • Role           │  │ • ListingImage   │  │ • Escrow-الضمان  │   │
│  │ • UserRole       │  │ • ListingAttr    │  │ • Commission     │   │
│  │ • UserClaim      │  │ • Favorite       │  │ • Wallet         │   │
│  │ • RefreshToken   │  │ • SavedSearch    │  │                  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  💬 COMMUNICATE  │  │  📊 ANALYTICS    │  │  🛡️ MODERATION   │   │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤   │
│  │ • Conversation   │  │ • AuditLog       │  │ • Report         │   │
│  │ • Message        │  │ • ViewLog        │  │ • Dispute        │   │
│  │ • Review         │  │ • SearchLog      │  │ • Ban            │   │
│  │ • Notification   │  │                  │  │ • ContentFlag    │   │
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
| **D** | Derived attribute |
| **M** | Multivalued attribute |
| **C** | Composite attribute |
| `──────` | Identifying relationship |
| `- - - -` | Non-identifying relationship |
| `1` | One (cardinality) |
| `N` or `*` | Many (cardinality) |
| `○` | Optional participation |
| `│` | Mandatory participation |

---

# 2. Core & Authentication Entities

## 2.1 Entity: Person

> **Description**: Real-world person who may or may not have a user account.

```
┌────────────────────────────────────────┐
│              PERSON                     │
├────────────────────────────────────────┤
│ PK   Id              INT               │
├────────────────────────────────────────┤
│ NN   FirstName       NVARCHAR(100)     │
│ NN   LastName        NVARCHAR(100)     │
│      DateOfBirth     DATE              │
│      Gender          CHAR(1)           │ -- M/F/O
│      NationalId      NVARCHAR(50)      │ -- For KYC
│      ProfileImages NVARCHAR(500)     	 │ -- Multi Value => New Table + new attribute of (ImageOrder)
├────────────────────────────────────────┤
│ M    Emails          [PersonEmails]    │ -- 1:N -- Multi Value => New Table + new attribute of (EmailOrder)
│ M    Phones          [PersonPhones]    │ -- 1:N -- Multi Value => New Table + new attribute of (PhonesOrder)
│ C,M  Addresses       [PersonAddresses] │ -- 1:N, Composite
├────────────────────────────────────────┤
│ NN   Status          TINYINT           │ -- 0=Active,1=Inactive,2=Banned
│ NN   CreatedAt       DATETIME2         │
│      UpdatedAt       DATETIME2         │
├────────────────────────────────────────┤
│ D    FullName        (FirstName+Last)  │ -- Computed
│ D    Age             (from DOB)        │ -- Computed
│ D    PrimaryEmail    (first email)     │ -- Computed
│ D    PrimaryPhone    (first phone)     │ -- Computed
└────────────────────────────────────────┘
```

### Multivalued Attribute Tables

```sql
-- PersonEmails (1 Person → Many Emails)
┌─────────────────────────────────────┐
│          PERSON_EMAILS              │
├─────────────────────────────────────┤
│ PK   Id           INT               │
│ FK   PersonId     INT               │
│ FK   UserId       INT               │
│ NN   Email        NVARCHAR(255)     │
│ NN   IsPrimary    BIT               │
│ NN   IsVerified   BIT               │
│ NN   CreatedAt    DATETIME2         │
└─────────────────────────────────────┘

-- PersonPhones (1 Person → Many Phones)
┌─────────────────────────────────────┐
│          PERSON_PHONES              │
├─────────────────────────────────────┤
│ PK   Id           INT               │
│ FK   PersonId     INT               │
│ FK   UserId       INT               │
│ NN   Phone        NVARCHAR(20)      │
│      CountryCode  NVARCHAR(5)       │
│ NN   IsPrimary    BIT               │
│ NN   IsVerified   BIT               │
│ NN   CreatedAt    DATETIME2         │
└─────────────────────────────────────┘

-- PersonAddresses (1 Person → Many Addresses) - COMPOSITE
┌─────────────────────────────────────┐
│        PERSON_ADDRESSES             │
├─────────────────────────────────────┤
│ PK   Id           INT               │
│ FK   PersonId     INT               │
│ FK   UserId       INT               │
│ NN   AddressLine1 NVARCHAR(255)     │
│ NN   City         NVARCHAR(100)     │
│      State        NVARCHAR(100)     │
│      PostalCode   NVARCHAR(20)      │
│ NN   Country      NVARCHAR(100)     │
│ NN   AddressType  TINYINT           │ -- 0=Home,1=Work,2=Other
│ NN   IsPrimary    BIT               │
│ NN   CreatedAt    DATETIME2         │
└─────────────────────────────────────┘
```

---

## 2.2 Entity: User

> **Description**: Authentication account linked to a Person. One Person = One User.

```
┌────────────────────────────────────────┐
│                USER                     │
├────────────────────────────────────────┤
│ PK   Id                INT             │
│ FK   PersonId          INT             │ -- 1:1 with Person
├────────────────────────────────────────┤
│ UK   Login          NVARCHAR(50)    │
│ UK   Email             NVARCHAR(255)   │ -- Auth email
│ NN   PasswordHash      NVARCHAR(255)   │ -- BCrypt
│      PasswordSalt      NVARCHAR(255)   │ -- If needed
├────────────────────────────────────────┤
│ NN   IsActive          BIT             │
│ NN   IsDeleted         BIT             │ -- Soft delete
│      DeletedAt         DATETIME2       │
│ NN   EmailVerified     BIT             │
│ NN   PhoneVerified     BIT             │
├────────────────────────────────────────┤
│      LastLoginAt       DATETIME2       │
│      LastLoginIp       NVARCHAR(45)    │
│ NN   FailedLoginCount  INT             │
│      LockoutEnd        DATETIME2       │ -- Not Needed (I don't know why it is)
├────────────────────────────────────────┤
│ NN   TwoFactorEnabled  BIT             │ -- Not Needed
│      TwoFactorSecret   NVARCHAR(255)   │ -- Not Needed
├────────────────────────────────────────┤
│ NN   CreatedAt         DATETIME2       │
│      UpdatedAt         DATETIME2       │
└────────────────────────────────────────┘
```

---

## 2.3 Entity: Role

> **Description**: Defines what actions a user can perform within the marketplace permission model.

```
┌────────────────────────────────────────┐
│                ROLE                     │
├────────────────────────────────────────┤
│ PK   Id           INT                  │
│ UK   Name         NVARCHAR(100)        │
│      Description  NVARCHAR(500)        │
│ NN   IsActive     BIT                  │
│ NN   CreatedAt    DATETIME2            │
│      UpdatedAt    DATETIME2            │
└────────────────────────────────────────┘

-- Seed Data:
-- Admin, ProjectManager, Support, Seller, Buyer, DeliveryAgent
```

---

## 2.4 Entity: UserRole (Junction)

> **Description**: Many-to-Many between User and Role

```
┌────────────────────────────────────────┐
│             USER_ROLES                  │
├────────────────────────────────────────┤
│ PK   Id           INT                  │
│ FK   UserId       INT                  │
│ FK   RoleId       INT                  │
│ NN   AssignedAt   DATETIME2            │
│ FK   AssignedBy   INT                  │ -- Which admin assigned
├────────────────────────────────────────┤
│ UK   (UserId, RoleId)                  │ -- Unique combo
└────────────────────────────────────────┘
```

---

## 2.5 Entity: UserClaim

> **Description**: Key-value attributes for VIP status, subscriptions, verification flags

```
┌────────────────────────────────────────┐
│            USER_CLAIMS                  │
├────────────────────────────────────────┤
│ PK   Id           INT                  │
│ FK   UserId       INT                  │
│ NN   ClaimType    NVARCHAR(255)        │ -- e.g., "subscription_tier"
│ NN   ClaimValue   NVARCHAR(1000)       │ -- e.g., "VIP"
│ NN   CreatedAt    DATETIME2            │
│      ExpiresAt    DATETIME2            │ -- NULL = never expires
├────────────────────────────────────────┤
│ UK   (UserId, ClaimType)               │
└────────────────────────────────────────┘
```

---

## 2.6 Entity: RefreshToken

> **Status**: Legacy concept only. The current runtime uses a JWT cookie plus `/api/auth/refresh` and token blacklisting; this table is not part of the active schema.

```
┌────────────────────────────────────────┐
│          REFRESH_TOKENS                 │
├────────────────────────────────────────┤
│ PK   Id                INT             │
│ FK   UserId            INT             │
├────────────────────────────────────────┤
│ UK   Token             NVARCHAR(500)   │
│ NN   TokenHash         NVARCHAR(128)   │ -- SHA-256
│ NN   ExpiresAt         DATETIME2       │
│ NN   CreatedAt         DATETIME2       │
│      CreatedByIp       NVARCHAR(45)    │
├────────────────────────────────────────┤
│      RevokedAt         DATETIME2       │
│      RevokedByIp       NVARCHAR(45)    │
│      RevokedReason     NVARCHAR(255)   │
│ FK   ReplacedByTokenId INT             │ -- Token rotation
├────────────────────────────────────────┤
│      DeviceId          NVARCHAR(255)   │
│      DeviceName        NVARCHAR(255)   │
│      UserAgent         NVARCHAR(500)   │
├────────────────────────────────────────┤
│ D    IsExpired         (computed)      │
│ D    IsRevoked         (computed)      │
│ D    IsActive          (computed)      │
└────────────────────────────────────────┘
```

---

# 3. Marketplace Entities

## 3.1 Entity: Category

> **Description**: Hierarchical product categories (Electronics → Phones → iPhone)

```
┌────────────────────────────────────────┐
│              CATEGORY                   │
├────────────────────────────────────────┤
│ PK   Id              INT               │
│ FK   ParentId        INT               │ -- Self-referencing (NULL = root)
├────────────────────────────────────────┤
│ NN   Name            NVARCHAR(100)     │
│ UK   Slug            NVARCHAR(100)     │ -- URL-friendly
│      Description     NVARCHAR(500)     │
│      IconUrl         NVARCHAR(500)     │
│      ImageUrl        NVARCHAR(500)     │
├────────────────────────────────────────┤
│ NN   DisplayOrder    INT               │
│ NN   IsActive        BIT               │
│ NN   IsFeatured      BIT               │
├────────────────────────────────────────┤
│ NN   CreatedAt       DATETIME2         │
│      UpdatedAt       DATETIME2         │
├────────────────────────────────────────┤
│ D    Level           (computed depth)  │
│ D    FullPath        (Parent > Child)  │
│ D    ListingCount    (count listings)  │
└────────────────────────────────────────┘
```

---

## 3.2 Entity: CategoryAttribute (Dynamic Fields)

> **Description**: Defines what attributes each category needs (e.g., Cars need "Mileage", Phones need "Storage")

```
┌────────────────────────────────────────┐
│        CATEGORY_ATTRIBUTES              │
├────────────────────────────────────────┤
│ PK   Id              INT               │
│ FK   CategoryId      INT               │
├────────────────────────────────────────┤
│ NN   Name            NVARCHAR(100)     │ -- "Mileage", "Storage"
│ NN   DisplayName     NVARCHAR(100)     │ -- "Mileage (km)"
│ NN   DataType        NVARCHAR(20)      │ -- TEXT, NUMBER, SELECT, BOOL
│      Options         NVARCHAR(MAX)     │ -- JSON for SELECT options
│      Unit            NVARCHAR(20)      │ -- "km", "GB", "JOD"
├────────────────────────────────────────┤
│ NN   IsRequired      BIT               │
│ NN   IsFilterable    BIT               │ -- Show in search filters
│ NN   IsSearchable    BIT               │
│ NN   DisplayOrder    INT               │
├────────────────────────────────────────┤
│      ValidationRegex NVARCHAR(255)     │
│      MinValue        DECIMAL           │
│      MaxValue        DECIMAL           │
└────────────────────────────────────────┘
```

---

## 3.3 Entity: Listing

> **Description**: The core marketplace item - what users sell. FLEXIBLE model for any item type.

```
┌────────────────────────────────────────────┐
│                 LISTING                     │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   SellerId            INT               │ -- User who posted
│ FK   CategoryId          INT               │
├────────────────────────────────────────────┤
│ NN   Title               NVARCHAR(200)     │
│ NN   Description         NVARCHAR(MAX)     │
│ UK   Slug                NVARCHAR(250)     │ -- URL-friendly
├────────────────────────────────────────────┤
│ NN   Price               DECIMAL(18,2)     │
│      OriginalPrice       DECIMAL(18,2)     │ -- For "was X now Y"
│ NN   Currency            CHAR(3)           │ -- JOD, USD, EUR
│ NN   PriceType           TINYINT           │ -- 0=Fixed,1=Negotiable,2=Free,3=Contact
├────────────────────────────────────────────┤
│ NN   Condition           TINYINT           │ -- 0=New,1=LikeNew,2=Good,3=Fair,4=ForParts
│ NN   ListingType         TINYINT           │ -- 0=ForSale,1=Wanted,2=ForRent,3=Service
├────────────────────────────────────────────┤
│ NN   Status              TINYINT           │ -- See status enum below
│      StatusReason        NVARCHAR(255)     │ -- Why rejected/removed
├────────────────────────────────────────────┤
│ FK   LocationId          INT               │ -- Link to address/location
│      City                NVARCHAR(100)     │ -- Denormalized for search
│      Area                NVARCHAR(100)     │
│      Latitude            DECIMAL(10,8)     │
│      Longitude           DECIMAL(11,8)     │
├────────────────────────────────────────────┤
│ NN   ViewCount           INT               │ -- Increment on view
│ NN   FavoriteCount       INT               │ -- Denormalized
│ NN   InquiryCount        INT               │ -- Messages received
├────────────────────────────────────────────┤
│      ExpiresAt           DATETIME2         │ -- Auto-expire old listings && Give User Notification that Listing will be Expired after (Default 30 Days).
│ NN   IsPromoted          BIT               │ -- Paid promotion
│      PromotedUntil       DATETIME2         │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      UpdatedAt           DATETIME2         │
│      PublishedAt         DATETIME2         │ -- When approved
│      SoldAt              DATETIME2         │
│      DeletedAt           DATETIME2         │ -- Soft delete
├────────────────────────────────────────────┤
│ D    DaysSincePosted     (computed)        │
│ D    IsExpired           (computed)        │
│ D    PrimaryImage        (first image)     │
└────────────────────────────────────────────┘

-- Status Enum:
-- 0 = Draft
-- 1 = PendingReview
-- 2 = Active
-- 3 = Sold
-- 4 = Expired
-- 5 = Rejected
-- 6 = Removed (by admin)
-- 7 = Deleted (by user)
```

---

## 3.4 Entity: ListingImage

> **Description**: Images for a listing (1 Listing → Many Images)

```
┌────────────────────────────────────────┐
│          LISTING_IMAGES                 │
├────────────────────────────────────────┤
│ PK   Id              INT               │
│ FK   ListingId       INT               │
├────────────────────────────────────────┤
│ NN   ImageUrl        NVARCHAR(500)     │
│      ThumbnailUrl    NVARCHAR(500)     │
│ NN   DisplayOrder    INT               │
│ NN   IsPrimary       BIT               │
├────────────────────────────────────────┤
│      AltText         NVARCHAR(255)     │
│      Width           INT               │
│      Height          INT               │
│      FileSize        INT               │ -- bytes
├────────────────────────────────────────┤
│ NN   CreatedAt       DATETIME2         │
└────────────────────────────────────────┘
```

---

## 3.5 Entity: ListingAttribute

> **Description**: Dynamic attribute values for listings (EAV pattern)

```
┌────────────────────────────────────────┐
│        LISTING_ATTRIBUTES               │
├────────────────────────────────────────┤
│ PK   Id                    INT         │
│ FK   ListingId             INT         │
│ FK   CategoryAttributeId   INT         │
├────────────────────────────────────────┤
│ NN   Value                 NVARCHAR(500)│
│      NumericValue          DECIMAL      │ -- For range queries
├────────────────────────────────────────┤
│ UK   (ListingId, CategoryAttributeId)  │
└────────────────────────────────────────┘

-- Example: Listing #5 (iPhone), CategoryAttribute "Storage" = "128GB" - بدل ما تعمل Hard Coding ل Fields and Attributes لازم يلتزم فيهم الشخص ، انت ما بتعرف  شو البزنس لكل شي فانت بهاي الطريقة بتعطيه خيار يعمل Customization
```

---

## 3.6 Entity: Favorite

> **Description**: User wishlists/favorites

```
┌────────────────────────────────────────┐
│              FAVORITES                  │
├────────────────────────────────────────┤
│ PK   Id              INT               │
│ FK   UserId          INT               │
│ FK   ListingId       INT               │
│ NN   CreatedAt       DATETIME2         │
├────────────────────────────────────────┤
│ UK   (UserId, ListingId)               │
└────────────────────────────────────────┘
```

---

## 3.7 Entity: SavedSearch

> **Description**: Users save search queries for notifications

```
┌────────────────────────────────────────┐
│           SAVED_SEARCHES                │
├────────────────────────────────────────┤
│ PK   Id              INT               │
│ FK   UserId          INT               │
├────────────────────────────────────────┤
│ NN   Name            NVARCHAR(100)     │
│ NN   SearchQuery     NVARCHAR(MAX)     │ -- JSON: {category, price, location...}
│ NN   NotifyByEmail   BIT               │
│ NN   NotifyByPush    BIT               │
│      NotifyFrequency TINYINT           │ -- 0=Instant,1=Daily,2=Weekly
├────────────────────────────────────────┤
│ NN   IsActive        BIT               │
│ NN   CreatedAt       DATETIME2         │
│      LastNotifiedAt  DATETIME2         │
└────────────────────────────────────────┘
```

---

# 4. Transaction & Payment Entities

## 4.1 Entity: Transaction

> **Description**: Records when a buyer purchases from a seller. NOT like traditional orders.

```
┌────────────────────────────────────────────┐
│              TRANSACTION                    │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ UK   TransactionNumber   NVARCHAR(50)      │ -- TRX-20251208-XXXXX
├────────────────────────────────────────────┤
│ FK   ListingId           INT               │
│ FK   BuyerId             INT               │ -- User buying
│ FK   SellerId            INT               │ -- User selling (denormalized)
├────────────────────────────────────────────┤
│ NN   AgreedPrice         DECIMAL(18,2)     │ -- Final negotiated price
│ NN   Currency            CHAR(3)           │
│      OriginalListingPrice DECIMAL(18,2)   │ -- For reference
├────────────────────────────────────────────┤
│ NN   Status              TINYINT           │ -- See enum below
│      StatusReason        NVARCHAR(255)     │
├────────────────────────────────────────────┤
│ NN   PaymentMethod       TINYINT           │ -- 0=Cash,1=Platform,2=BankTransfer
│ NN   DeliveryMethod      TINYINT           │ -- 0=Pickup,1=Delivery,2=Shipping
├────────────────────────────────────────────┤
│      DeliveryAddress     NVARCHAR(500)     │
│      DeliveryNotes       NVARCHAR(500)     │
│      TrackingNumber      NVARCHAR(100)     │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      AcceptedAt          DATETIME2         │
│      PaidAt              DATETIME2         │
│      ShippedAt           DATETIME2         │
│      DeliveredAt         DATETIME2         │
│      CompletedAt         DATETIME2         │
│      CancelledAt         DATETIME2         │
│      DisputedAt          DATETIME2         │
├────────────────────────────────────────────┤
│      BuyerNotes          NVARCHAR(500)     │
│      SellerNotes         NVARCHAR(500)     │
└────────────────────────────────────────────┘

-- Status Enum:
-- 0 = Initiated (buyer sent offer)
-- 1 = Accepted (seller accepted)
-- 2 = PendingPayment
-- 3 = Paid (awaiting delivery)
-- 4 = Shipped
-- 5 = Delivered
-- 6 = Completed (both confirmed)
-- 7 = Cancelled
-- 8 = Disputed
-- 9 = Refunded
```

---

## 4.2 Entity: Payment

> **Description**: Payment records for transactions

```
┌────────────────────────────────────────────┐
│                PAYMENT                      │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   TransactionId       INT               │
│ UK   PaymentReference    NVARCHAR(100)     │ -- External gateway ref
├────────────────────────────────────────────┤
│ NN   Amount              DECIMAL(18,2)     │
│ NN   Currency            CHAR(3)           │
│ NN   PaymentMethod       TINYINT           │ -- Card, Wallet, Bank
├────────────────────────────────────────────┤
│ NN   Status              TINYINT           │ -- Pending,Success,Failed,Refunded
│      FailureReason       NVARCHAR(255)     │
├────────────────────────────────────────────┤
│      GatewayName         NVARCHAR(50)      │ -- Stripe, PayPal, etc.
│      GatewayTxnId        NVARCHAR(255)     │
│      GatewayResponse     NVARCHAR(MAX)     │ -- JSON
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      ProcessedAt         DATETIME2         │
│      RefundedAt          DATETIME2         │
└────────────────────────────────────────────┘
```

---

## 4.3 Entity: Escrow

> **Description**: Platform holds payment until transaction completes

```
┌────────────────────────────────────────────┐
│                ESCROW                       │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   TransactionId       INT               │
│ FK   PaymentId           INT               │
├────────────────────────────────────────────┤
│ NN   Amount              DECIMAL(18,2)     │ -- Held amount
│ NN   Currency            CHAR(3)           │
├────────────────────────────────────────────┤
│ NN   Status              TINYINT           │ -- 0=Holding,1=Released,2=Refunded,3=Disputed
├────────────────────────────────────────────┤
│ NN   HeldAt              DATETIME2         │
│      ReleasedAt          DATETIME2         │
│      RefundedAt          DATETIME2         │
│      ReleaseReason       NVARCHAR(255)     │
└────────────────────────────────────────────┘
```

---

## 4.4 Entity: Commission

> **Description**: Platform fees per transaction

```
┌────────────────────────────────────────────┐
│              COMMISSION                     │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   TransactionId       INT               │
├────────────────────────────────────────────┤
│ NN   BaseAmount          DECIMAL(18,2)     │ -- Transaction amount
│ NN   CommissionRate      DECIMAL(5,4)      │ -- 0.0500 = 5%
│ NN   CommissionAmount    DECIMAL(18,2)     │ -- Calculated
│ NN   Currency            CHAR(3)           │
├────────────────────────────────────────────┤
│ NN   Status              TINYINT           │ -- Pending, Collected, Waived
│      WaivedReason        NVARCHAR(255)     │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      CollectedAt         DATETIME2         │
└────────────────────────────────────────────┘
```

---

## 4.5 Entity: Wallet (Optional)

> **Description**: User balance for platform payments

```
┌────────────────────────────────────────────┐
│                WALLET                       │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   UserId              INT               │ -- 1:1
├────────────────────────────────────────────┤
│ NN   Balance             DECIMAL(18,2)     │
│ NN   Currency            CHAR(3)           │
│ NN   IsActive            BIT               │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      UpdatedAt           DATETIME2         │
└────────────────────────────────────────────┘

-- WalletTransaction (1 Wallet → Many Transactions)
┌────────────────────────────────────────────┐
│         WALLET_TRANSACTIONS                 │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   WalletId            INT               │
├────────────────────────────────────────────┤
│ NN   Type                TINYINT           │ -- Credit, Debit, Refund
│ NN   Amount              DECIMAL(18,2)     │
│ NN   BalanceAfter        DECIMAL(18,2)     │
│      Description         NVARCHAR(255)     │
│ FK   RelatedTransactionId INT              │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
└────────────────────────────────────────────┘
```

---

# 5. Communication Entities

## 5.1 Entity: Conversation

> **Description**: Chat thread between buyer and seller about a listing

```
┌────────────────────────────────────────────┐
│            CONVERSATION                     │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   ListingId           INT               │
│ FK   BuyerId             INT               │ -- Who initiated
│ FK   SellerId            INT               │ -- Listing owner
├────────────────────────────────────────────┤
│ NN   Status              TINYINT           │ -- 0=Active,1=Archived,2=Blocked
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      LastMessageAt       DATETIME2         │ -- Denormalized
│ NN   BuyerUnreadCount    INT               │
│ NN   SellerUnreadCount   INT               │
├────────────────────────────────────────────┤
│ UK   (ListingId, BuyerId)                  │ -- One convo per buyer per listing
└────────────────────────────────────────────┘
```

---

## 5.2 Entity: Message

> **Description**: Individual messages in a conversation

```
┌────────────────────────────────────────────┐
│               MESSAGE                       │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   ConversationId      INT               │
│ FK   SenderId            INT               │ -- User who sent
├────────────────────────────────────────────┤
│ NN   Content             NVARCHAR(MAX)     │
│ NN   MessageType         TINYINT           │ -- 0=Text,1=Image,2=Offer,3=System
│      AttachmentUrl       NVARCHAR(500)     │
├────────────────────────────────────────────┤
│      OfferAmount         DECIMAL(18,2)     │ -- If MessageType=Offer
│      OfferStatus         TINYINT           │ -- Pending,Accepted,Rejected
├────────────────────────────────────────────┤
│ NN   IsRead              BIT               │
│      ReadAt              DATETIME2         │
│ NN   IsDeleted           BIT               │ -- Soft delete for sender
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
└────────────────────────────────────────────┘
```

---

## 5.3 Entity: Review

> **Description**: Users review each other after transactions (not products!)

```
┌────────────────────────────────────────────┐
│                REVIEW                       │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   TransactionId       INT               │
│ FK   ReviewerId          INT               │ -- Who wrote review
│ FK   RevieweeId          INT               │ -- Who is being reviewed
├────────────────────────────────────────────┤
│ NN   Rating              TINYINT           │ -- 1-5 stars
│      Title               NVARCHAR(100)     │
│      Comment             NVARCHAR(1000)    │
├────────────────────────────────────────────┤
│ NN   ReviewType          TINYINT           │ -- 0=BuyerToSeller, 1=SellerToBuyer
├────────────────────────────────────────────┤
│ NN   IsVisible           BIT               │ -- Admin can hide
│      HiddenReason        NVARCHAR(255)     │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      UpdatedAt           DATETIME2         │
├────────────────────────────────────────────┤
│ UK   (TransactionId, ReviewerId)           │ -- One review per user per txn
└────────────────────────────────────────────┘
```

---

## 5.4 Entity: Report

> **Description**: Users report listings, users, or messages

```
┌────────────────────────────────────────────┐
│                REPORT                       │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   ReporterId          INT               │ -- Who reported
├────────────────────────────────────────────┤
│ NN   TargetType          TINYINT           │ -- 0=Listing,1=User,2=Message,3=Review
│ NN   TargetId            INT               │ -- ID of reported item
├────────────────────────────────────────────┤
│ NN   ReasonCode          TINYINT           │ -- See enum below
│      Description         NVARCHAR(1000)    │
├────────────────────────────────────────────┤
│ NN   Status              TINYINT           │ -- 0=Pending,1=Reviewed,2=ActionTaken,3=Dismissed
│      Resolution          NVARCHAR(500)     │
│ FK   ResolvedBy          INT               │ -- Admin who handled
│      ResolvedAt          DATETIME2         │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
└────────────────────────────────────────────┘

-- ReasonCode Enum:
-- 0 = Spam
-- 1 = Fraud/Scam
-- 2 = ProhibitedItem
-- 3 = Harassment
-- 4 = Duplicate
-- 5 = WrongCategory
-- 6 = Inappropriate
-- 7 = Other
```

---

## 5.5 Entity: Notification

> **Description**: In-app and push notifications

```
┌────────────────────────────────────────────┐
│            NOTIFICATION                     │
├────────────────────────────────────────────┤
│ PK   Id                  INT               │
│ FK   UserId              INT               │
├────────────────────────────────────────────┤
│ NN   Type                TINYINT           │ -- See enum
│ NN   Title               NVARCHAR(200)     │
│      Body                NVARCHAR(500)     │
│      ImageUrl            NVARCHAR(500)     │
├────────────────────────────────────────────┤
│      TargetType          TINYINT           │ -- What to open
│      TargetId            INT               │ -- ID to navigate to
│      ActionUrl           NVARCHAR(500)     │
├────────────────────────────────────────────┤
│ NN   IsRead              BIT               │
│      ReadAt              DATETIME2         │
│ NN   IsPushed            BIT               │ -- Sent to device
│      PushedAt            DATETIME2         │
├────────────────────────────────────────────┤
│ NN   CreatedAt           DATETIME2         │
│      ExpiresAt           DATETIME2         │
└────────────────────────────────────────────┘

-- Type Enum:
-- 0 = NewMessage
-- 1 = NewOffer
-- 2 = OfferAccepted
-- 3 = ListingApproved
-- 4 = ListingRejected
-- 5 = NewReview
-- 6 = TransactionUpdate
-- 7 = SavedSearchMatch
-- 8 = System
```

---

# 6. Relationships Diagram

## 6.1 Core/Auth Relationships

```
┌────────────┐         ┌────────────┐
│   Person   │ 1─────1 │    User    │
└────────────┘         └────────────┘
      │                      │
      │ 1                    │ 1
      │                      │
      ▼ N                    ▼ N
┌────────────┐         ┌────────────────┐
│ PersonEmail│         │  RefreshToken  │
│ PersonPhone│         └────────────────┘
│ PersonAddr │               │ 1
└────────────┘               │
                             ▼ N
                       ┌────────────┐
                       │  UserRole  │
                       └────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼ N            │              ▼ N
        ┌──────────┐         │        ┌────────────┐
        │   Role   │         │        │ UserClaim  │
        └──────────┘         │        └────────────┘
                             │
                             ▼ 1
                       ┌──────────┐
                       │   User   │
                       └──────────┘
```

## 6.2 Marketplace Relationships

```
                           ┌────────────┐
                           │  Category  │ ◀──┐ (Self-ref: ParentId)
                           └────────────┘ ───┘
                                 │ 1
                                 │
              ┌──────────────────┼──────────────────┐
              ▼ N                ▼ N                │
     ┌─────────────────┐  ┌─────────────────┐       │
     │ CategoryAttrib  │  │    Listing      │       │
     └─────────────────┘  └─────────────────┘       │
              │                   │ 1               │
              │                   │                 │
              ▼ N                 ├────────┬────────┼────────┐
        ┌───────────────┐        ▼ N      ▼ N      ▼ N      ▼ N
        │ListingAttrib  │  ┌──────────┐ ┌──────┐ ┌────────┐ ┌────────┐
        └───────────────┘  │ListImage │ │Favor │ │Convers │ │Transact│
                           └──────────┘ │ite   │ │ation   │ │ion     │
                                        └──────┘ └────────┘ └────────┘
```

## 6.3 Transaction Flow

```
┌────────┐     ┌─────────────┐     ┌────────────┐
│ Buyer  │────▶│ Transaction │◀────│  Listing   │
│ (User) │     └─────────────┘     └────────────┘
└────────┘           │ 1                  │
     ▲               │                    │
     │               ├────────────────────┘
     │               ▼ N
     │         ┌───────────┐
     │         │  Payment  │
     │         └───────────┘
     │               │ 1
     │               ▼ 1
     │         ┌───────────┐
     │         │  Escrow   │
     │         └───────────┘
     │               │ 1
     │               ▼ 1
     │         ┌───────────┐
     │         │Commission │
     │         └───────────┘
     │
     └─────────────────────── (Seller is also User)
```

## 6.4 Communication Flow

```
┌────────┐               ┌────────────┐               ┌────────┐
│ Buyer  │──────────────▶│Conversation│◀──────────────│ Seller │
│ (User) │               └────────────┘               │ (User) │
└────────┘                     │ 1                    └────────┘
     │                         │                           │
     │                         ▼ N                         │
     │                   ┌───────────┐                     │
     └──────────────────▶│  Message  │◀────────────────────┘
                         └───────────┘
                               │
                               │ (after Transaction)
                               ▼
                         ┌───────────┐
                         │  Review   │ (User reviews User)
                         └───────────┘
```

## 6.5 Complete Relationship Matrix

| Entity A | Relationship | Entity B | Cardinality | Type |
|----------|--------------|----------|-------------|------|
| Person | has | User | 1:1 | Identifying |
| Person | has | PersonEmail | 1:N | Identifying |
| Person | has | PersonPhone | 1:N | Identifying |
| Person | has | PersonAddress | 1:N | Identifying |
| User | has | RefreshToken | 1:N | Identifying |
| User | has | UserRole | 1:N | Identifying |
| Role | assigned to | UserRole | 1:N | Identifying |
| User | has | UserClaim | 1:N | Identifying |
| Category | parent of | Category | 1:N | Self-ref |
| Category | defines | CategoryAttribute | 1:N | Identifying |
| Category | contains | Listing | 1:N | Non-identifying |
| User | creates | Listing | 1:N | Non-identifying |
| Listing | has | ListingImage | 1:N | Identifying |
| Listing | has | ListingAttribute | 1:N | Identifying |
| User | favorites | Listing | N:M | Non-identifying |
| User | saves | SavedSearch | 1:N | Identifying |
| Listing | discussed in | Conversation | 1:N | Non-identifying |
| User (Buyer) | participates | Conversation | 1:N | Non-identifying |
| Conversation | contains | Message | 1:N | Identifying |
| Listing | sold via | Transaction | 1:1 | Non-identifying |
| User (Buyer) | initiates | Transaction | 1:N | Non-identifying |
| User (Seller) | receives | Transaction | 1:N | Non-identifying |
| Transaction | paid by | Payment | 1:N | Identifying |
| Payment | held in | Escrow | 1:1 | Identifying |
| Transaction | charged | Commission | 1:1 | Identifying |
| Transaction | reviewed in | Review | 1:2 | Non-identifying |
| User | writes | Review | 1:N | Non-identifying |
| User | receives | Review | 1:N | Non-identifying |
| User | submits | Report | 1:N | Non-identifying |
| User | receives | Notification | 1:N | Identifying |

---

# 7. Relational Schema (3NF)

## 7.1 Summary Table

| Table | Description | Estimated Rows |
|-------|-------------|----------------|
| Persons | Real people | 100K+ |
| PersonEmails | Multiple emails | 150K+ |
| PersonPhones | Multiple phones | 120K+ |
| PersonAddresses | Multiple addresses | 80K+ |
| Users | Auth accounts | 100K+ |
| Roles | System roles | ~10 |
| UserRoles | User-Role mapping | 150K+ |
| UserClaims | User attributes | 50K+ |
| RefreshTokens | Auth tokens | 500K+ |
| Categories | Hierarchical | ~500 |
| CategoryAttributes | Dynamic fields | ~2K |
| Listings | Items for sale | 500K+ |
| ListingImages | Item photos | 2M+ |
| ListingAttributes | Dynamic values | 3M+ |
| Favorites | Wishlists | 1M+ |
| SavedSearches | Alert queries | 50K+ |
| Conversations | Chat threads | 300K+ |
| Messages | Chat messages | 5M+ |
| Transactions | Completed sales | 200K+ |
| Payments | Payment records | 200K+ |
| Escrows | Held funds | 100K+ |
| Commissions | Platform fees | 200K+ |
| Reviews | User reviews | 300K+ |
| Reports | Abuse reports | 10K+ |
| Notifications | User alerts | 10M+ |

## 7.2 Index Recommendations

```sql
-- HIGH PRIORITY INDEXES

-- Users (Login performance)
CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
CREATE UNIQUE INDEX IX_Users_Username ON Users(Login);
CREATE INDEX IX_Users_PersonId ON Users(PersonId);

-- Listings (Search performance)
CREATE INDEX IX_Listings_CategoryId ON Listings(CategoryId);
CREATE INDEX IX_Listings_SellerId ON Listings(SellerId);
CREATE INDEX IX_Listings_Status ON Listings(Status);
CREATE INDEX IX_Listings_City ON Listings(City);
CREATE INDEX IX_Listings_CreatedAt ON Listings(CreatedAt DESC);
CREATE INDEX IX_Listings_Price ON Listings(Price);

-- Composite for search
CREATE INDEX IX_Listings_Search ON Listings(Status, CategoryId, City, Price);

-- Favorites
CREATE INDEX IX_Favorites_UserId ON Favorites(UserId);
CREATE INDEX IX_Favorites_ListingId ON Favorites(ListingId);

-- Conversations
CREATE INDEX IX_Conversations_BuyerId ON Conversations(BuyerId);
CREATE INDEX IX_Conversations_SellerId ON Conversations(SellerId);
CREATE INDEX IX_Conversations_ListingId ON Conversations(ListingId);

-- Messages
CREATE INDEX IX_Messages_ConversationId ON Messages(ConversationId, CreatedAt);

-- Transactions
CREATE INDEX IX_Transactions_BuyerId ON Transactions(BuyerId);
CREATE INDEX IX_Transactions_SellerId ON Transactions(SellerId);
CREATE INDEX IX_Transactions_Status ON Transactions(Status);

-- Notifications
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead, CreatedAt DESC);

-- RefreshTokens
CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
CREATE INDEX IX_RefreshTokens_TokenHash ON RefreshTokens(TokenHash);
```

---

## 7.3 SQL DDL Template (Core Tables)

```sql
-- ============================================================
-- CORE TABLES - COPY AND ADAPT FOR YOUR MIGRATIONS
-- ============================================================

-- Persons
CREATE TABLE Persons (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NULL,
    Gender CHAR(1) NULL,
    NationalId NVARCHAR(50) NULL,
    ProfileImageUrl NVARCHAR(500) NULL,
    Status TINYINT NOT NULL DEFAULT 0, -- 0=Active
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

-- PersonEmails
CREATE TABLE PersonEmails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PersonId INT NOT NULL FOREIGN KEY REFERENCES Persons(Id) ON DELETE CASCADE,
    Email NVARCHAR(255) NOT NULL,
    IsPrimary BIT NOT NULL DEFAULT 0,
    IsVerified BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Users
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PersonId INT NOT NULL FOREIGN KEY REFERENCES Persons(Id),
    Login NVARCHAR(50) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    EmailVerified BIT NOT NULL DEFAULT 0,
    PhoneVerified BIT NOT NULL DEFAULT 0,
    LastLoginAt DATETIME2 NULL,
    LastLoginIp NVARCHAR(45) NULL,
    FailedLoginCount INT NOT NULL DEFAULT 0,
    LockoutEnd DATETIME2 NULL,
    TwoFactorEnabled BIT NOT NULL DEFAULT 0,
    TwoFactorSecret NVARCHAR(255) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT UQ_Users_Username UNIQUE (Login),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);

-- Categories (Hierarchical)
CREATE TABLE Categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ParentId INT NULL FOREIGN KEY REFERENCES Categories(Id),
    Name NVARCHAR(100) NOT NULL,
    Slug NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL,
    IconUrl NVARCHAR(500) NULL,
    ImageUrl NVARCHAR(500) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    IsFeatured BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

-- Listings
CREATE TABLE Listings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SellerId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CategoryId INT NOT NULL FOREIGN KEY REFERENCES Categories(Id),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Slug NVARCHAR(250) NOT NULL UNIQUE,
    Price DECIMAL(18,2) NOT NULL,
    OriginalPrice DECIMAL(18,2) NULL,
    Currency CHAR(3) NOT NULL DEFAULT 'JOD',
    PriceType TINYINT NOT NULL DEFAULT 0, -- 0=Fixed
    Condition TINYINT NOT NULL DEFAULT 0, -- 0=New
    ListingType TINYINT NOT NULL DEFAULT 0, -- 0=ForSale
    Status TINYINT NOT NULL DEFAULT 0, -- 0=Draft
    StatusReason NVARCHAR(255) NULL,
    City NVARCHAR(100) NULL,
    Area NVARCHAR(100) NULL,
    Latitude DECIMAL(10,8) NULL,
    Longitude DECIMAL(11,8) NULL,
    ViewCount INT NOT NULL DEFAULT 0,
    FavoriteCount INT NOT NULL DEFAULT 0,
    InquiryCount INT NOT NULL DEFAULT 0,
    ExpiresAt DATETIME2 NULL,
    IsPromoted BIT NOT NULL DEFAULT 0,
    PromotedUntil DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    PublishedAt DATETIME2 NULL,
    SoldAt DATETIME2 NULL,
    DeletedAt DATETIME2 NULL
);

-- Transactions
CREATE TABLE Transactions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TransactionNumber NVARCHAR(50) NOT NULL UNIQUE,
    ListingId INT NOT NULL FOREIGN KEY REFERENCES Listings(Id),
    BuyerId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    SellerId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    AgreedPrice DECIMAL(18,2) NOT NULL,
    Currency CHAR(3) NOT NULL DEFAULT 'JOD',
    OriginalListingPrice DECIMAL(18,2) NULL,
    Status TINYINT NOT NULL DEFAULT 0,
    StatusReason NVARCHAR(255) NULL,
    PaymentMethod TINYINT NOT NULL DEFAULT 0,
    DeliveryMethod TINYINT NOT NULL DEFAULT 0,
    DeliveryAddress NVARCHAR(500) NULL,
    DeliveryNotes NVARCHAR(500) NULL,
    TrackingNumber NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    AcceptedAt DATETIME2 NULL,
    PaidAt DATETIME2 NULL,
    ShippedAt DATETIME2 NULL,
    DeliveredAt DATETIME2 NULL,
    CompletedAt DATETIME2 NULL,
    CancelledAt DATETIME2 NULL,
    DisputedAt DATETIME2 NULL,
    BuyerNotes NVARCHAR(500) NULL,
    SellerNotes NVARCHAR(500) NULL
);
```

---

## 📝 Next Steps

1. **Review this document** - Ensure all entities match your business needs
2. **Create ERD Diagram** - Use draw.io or similar with this as reference
3. **Generate SQL migrations** - Expand the DDL templates
4. **Create Domain Models** - C# classes for each entity
5. **Implement Repositories** - ADO.NET data access layer

---

> **Canonical follow-up**: Use `docs/DATABASE.md` for the active schema and `docs/reports/API_ENDPOINTS_STATUS.md` for runtime API/auth behavior.
