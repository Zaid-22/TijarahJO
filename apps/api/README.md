# TijarahJo – Database ERD Documentation

## 📌 Overview

**TijarahJo** is a *Customer-to-Customer (C2C) buy/sell platform* that allows users to create accounts, publish posts to sell items, categorize listings, upload images, manage multiple emails and locations, and track post statuses (active, blocked, sold out, etc.).

This document provides **complete documentation** of the **Entity-Relationship Diagram (ERD)** designed using **ERDPlus** and serves as a reference for developers, database designers, and reviewers.

---

## 🗂️ ERD Scope & Design Goals

The ERD aims to:

* Maintain **data normalization** and reduce redundancy
* Support **scalability** (multiple emails, locations, images)
* Ensure **data integrity** using primary & foreign keys
* Reflect **real-world marketplace behavior**

---

## 🧱 Entities Overview

The database consists of the following core entities:

1. **User**
2. **User_Emails**
3. **User_Locations**
4. **User_Posts**
5. **Post_Images**
6. **Item_Categories**

---

## 👤 Entity: User

Represents a registered user in the TijarahJo platform.

### Attributes

| Attribute       | Type    | Description                     |
| --------------- | ------- | ------------------------------- |
| **UserID** (PK) | INT     | Unique identifier for each user |
| Login        | VARCHAR | User's login name               |
| Email           | VARCHAR | Primary email address           |
| HashedPassword  | VARCHAR | Encrypted user password         |
| FirstName       | VARCHAR | User's first name               |
| MiddleName      | VARCHAR | User's middle name (optional)   |
| LastName        | VARCHAR | User's last name                |
| JoinDate        | DATE    | Account creation date           |
| Status          | ENUM    | `active`, `blocked`, `deleted`  |

### Notes

* Passwords are stored **hashed** for security
* User status controls access and visibility

---

## 📧 Entity: User_Emails

Stores **multiple email addresses** associated with a user.

### Attributes

| Attribute        | Type    | Description                   |
| ---------------- | ------- | ----------------------------- |
| **EmailID** (PK) | INT     | Unique email record ID        |
| UserID (FK)      | INT     | References `User.UserID`      |
| Email            | VARCHAR | Secondary or additional email |

### Relationship

* **One User → Many Emails**

---

## 📍 Entity: User_Locations

Represents locations associated with a user for item pickup or residence.

### Attributes

| Attribute           | Type    | Description                  |
| ------------------- | ------- | ---------------------------- |
| **LocationID** (PK) | INT     | Unique location identifier   |
| UserID (FK)         | INT     | References `User.UserID`     |
| LocationCity        | VARCHAR | City name                    |
| LocationArea        | VARCHAR | Area or district             |
| AdditionalInfo      | TEXT    | Optional directions or notes |

### Relationship

* **One User → Many Locations**

---

## 📝 Entity: User_Posts

Represents item listings posted by users for sale.

### Attributes

| Attribute       | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| **PostID** (PK) | INT     | Unique post identifier                      |
| UserID (FK)     | INT     | Owner of the post                           |
| CategoryID (FK) | INT     | Item category                               |
| PostTitle       | VARCHAR | Title of the listing                        |
| PostDescription | TEXT    | Detailed description                        |
| Price           | DECIMAL | Item price                                  |
| Status          | ENUM    | `active`, `inactive`, `blocked`, `sold_out` |

### Business Rules

* Only **active** posts are visible to buyers
* Posts can be **blocked** by admins
* Sold items are marked as `sold_out`

---

## 🖼️ Entity: Post_Images

Stores images related to a specific post.

### Attributes

| Attribute            | Type    | Description                    |
| -------------------- | ------- | ------------------------------ |
| **PostImageID** (PK) | INT     | Unique image identifier        |
| PostID (FK)          | INT     | References `User_Posts.PostID` |
| PostImageURL         | VARCHAR | Image storage URL              |

### Relationship

* **One Post → Many Images**

---

## 🗃️ Entity: Item_Categories

Defines item categories for organizing posts.

### Attributes

| Attribute           | Type    | Description                             |
| ------------------- | ------- | --------------------------------------- |
| **CategoryID** (PK) | INT     | Unique category ID                      |
| CategoryName        | VARCHAR | Category name (e.g., Electronics, Cars) |

### Relationship

* **One Category → Many Posts**

---

## 🔗 Relationships Summary

| Relationship                 | Type        |
| ---------------------------- | ----------- |
| User → User_Emails           | One-to-Many |
| User → User_Locations        | One-to-Many |
| User → User_Posts            | One-to-Many |
| Item_Categories → User_Posts | One-to-Many |
| User_Posts → Post_Images     | One-to-Many |

---

## 🔐 Data Integrity & Constraints

* **Primary Keys (PK)** ensure entity uniqueness
* **Foreign Keys (FK)** enforce referential integrity
* Cascading rules should be applied carefully:

  * Deleting a user should **soft-delete** related data
  * Posts should not be deleted automatically

---

## ⚙️ Design Considerations

* Normalized to **3rd Normal Form (3NF)**
* Supports future expansion:

  * Reviews & ratings
  * Messaging system
  * Favorites & bookmarks
* Optimized for C2C marketplace workflows

---

## 🛠️ Tools Used

* **ERD Design:** ERDPlus
* **Diagram Editor:** [https://erdplus-old.com](https://erdplus-old.com)

---

## 📄 Conclusion

This ERD provides a **robust, scalable, and secure foundation** for the **TijarahJo C2C marketplace**. It accurately models user behavior, item listings, categorization, and media handling while remaining extensible for future features.

---

✅ *This document is intended to be included directly as `README.md` in the project repository.*
