# TijarahJo Frontend

<div align="center">

![TijarahJo](https://img.shields.io/badge/TijarahJo-Marketplace-0A4ABF?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Modern, fully-integrated marketplace frontend built with React, TypeScript, and Tailwind CSS v4**

</div>

---

## 🌟 Features

### 🛍️ Marketplace
- Post creation, editing, status management (`active` / `sold` / `deleted`), and deletion
- Multiple view modes (4-column, 3-column, 2-column grid, list view)
- Advanced search with full-text support ("Search all posts")
- Category filtering with 15+ dedicated category pages
- Post favorites system (owners cannot favorite their own posts)
- Post details with image gallery and similar posts suggestions
- Share posts functionality and WhatsApp integration for seller contact
- Direct image upload from device (server-side file storage)
- Price validation (minimum 0.01 JOD, no negative prices)
- Location management with "City, Area" display format
- Post view tracking

### 👤 User & Authentication
- Login with username/email and registration pages
- Guest browsing mode (full marketplace access without login)
- Google OAuth 2.0 social login
- Two-Factor Authentication (TOTP via authenticator app)
- Password reset with email verification codes
- User profiles with editable information
- Post ownership detection and permissions
- Phone number with Jordan "+962" prefix validation
- Cookie-backed JWT authentication with `/auth/refresh` retry and quiet session revalidation

### 💬 Real-Time Chat
- Real-time messaging via SignalR WebSocket connection
- Image sharing in chat conversations
- Online/offline presence indicators
- Conversation list with recent messages
- Message read receipts

### 🔔 Notifications
- In-app notification system with unread count badge
- Mark as read / mark all as read

### ⭐ Reviews
- Seller reviews and ratings
- Public seller profile pages with review history

### 🛡️ Admin Panel
- Dashboard with key analytics and KPIs
- User management (view, block, delete, role assignment)
- Post moderation and content management
- Reports queue for flagged content
- Conversation monitoring
- Audit log viewer
- Location management
- System settings administration
- Admin-specific search tools

### 🌍 Internationalization
- Full English and Arabic languages
- Complete RTL (Right-to-Left) support
- Translated categories in both languages
- All UI elements fully translated
- Language switcher in settings
- Proper date/time localization

### 🎨 Modern UI/UX
- Responsive design (mobile, tablet, desktop)
- Full dark mode support with comfortable color scheme
- Smooth CSS and Tailwind-powered transitions
- Loading and error states
- Confirmation dialogs and toast notifications (Sonner)
- Pagination with configurable page sizes
- Professional UX audit completed (8.5/10 rating)

---

## 📁 Project Structure

```text
apps/web/src/
├── app/                          # Bootstrap, root composition, route shell
├── features/                     # Domain feature slices
│   ├── admin/                    # Admin panel (dashboard, users, posts, analytics)
│   ├── auth/                     # Login, signup, password reset, 2FA
│   ├── chat/                     # Real-time messaging
│   ├── home/                     # Landing page & hero section
│   ├── marketplace/              # Post browsing, categories, search
│   ├── post-details/             # Single post view, image gallery
│   ├── profile/                  # User profile editing
│   ├── seller-profile/           # Public seller pages & reviews
│   └── settings/                 # User settings, language, theme, 2FA
├── pages/                        # Route-level page composition
├── shared/                       # Reusable UI primitives (Radix-based)
├── services/                     # API client layer & chat service
├── contexts/                     # React contexts (auth, theme, language)
├── hooks/                        # Custom hooks
├── translations/                 # i18n string bundles (EN, AR)
├── types/                        # TypeScript interfaces
├── utils/                        # Utility functions
├── constants/                    # App constants & config
├── styles/                       # Global styles & Tailwind config
├── data/                         # Static data & seed content
├── lib/                          # Third-party lib wrappers
└── assets/                       # Static assets (logos, images)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd apps/web
npm install
npm run dev
```

The application will be available at **http://localhost:5173**

### Using Root Scripts (Recommended)

```bash
# From project root — starts both backend and frontend
./scripts/run-dev.sh
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **UI Library** | React 18 |
| **Language** | TypeScript 5 |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS v4 |
| **Components** | Radix UI (accessible primitives) |
| **Icons** | Lucide React |
| **Animations** | CSS and Tailwind transitions |
| **Realtime** | SignalR (@microsoft/signalr) |
| **Notifications** | Sonner (toast) |
| **Linting** | ESLint |

---

## 🔌 Backend Integration

### Current State
✅ Frontend and backend are **fully integrated** via REST APIs
✅ Auth, posts, favorites, categories, search, sellers, chat, reviews, notifications all wired
✅ Real-time chat via SignalR WebSocket hub
✅ Google OAuth flow integrated
✅ Two-Factor Authentication (TOTP) setup and verification
✅ Server-side image uploads for posts and chat
✅ Signed-in hard refresh keeps the page shell visible while auth header actions wait for session revalidation

### Backend API Surface

| Group | Endpoints |
|-------|-----------|
| **Auth** | `/api/v1/auth/*` — login, signup, logout, me, refresh, Google OAuth |
| **2FA** | `/api/v1/auth/2fa/*` — status, setup/start, setup/confirm, verify-login, disable |
| **Password Reset** | `/api/v1/auth/forgot-password/*` — request, confirm |
| **Posts** | `/api/v1/posts/*` — feed, CRUD, status, views |
| **Post Images** | `/api/v1/post-images/*` — CRUD, file upload |
| **Categories** | `/api/v1/categories/*` — list, CRUD (admin) |
| **Favorites** | `/api/v1/favorites/*` — list, add, remove |
| **Chat** | `/api/v1/chat/*` + `/chatHub` — messages, history, presence, upload |
| **Search** | `/api/v1/search` — full-text search |
| **Sellers** | `/api/v1/sellers/*` — profile, top sellers |
| **Reviews** | `/api/v1/reviews/*` — list, create |
| **Notifications** | `/api/v1/notifications/*` — list, read, unread count |
| **Admin** | `/api/v1/admin/*` — dashboard, users, posts, analytics, reports, settings |

---

## 📱 Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| Mobile (< 640px) | 1-column |
| Tablet (640px – 1024px) | 2-column |
| Desktop (> 1024px) | 3–4 column |

---

## 📱 Category System

15 dedicated category pages:
Electronics • Mobile Phones & Tablets • Computers & Laptops • Home Appliances • Furniture • Vehicles • Fashion & Clothing • Health & Beauty • Sports & Fitness • Books & Stationery • Toys & Games • Real Estate • Pets & Animals • Services • Other

---

## 🧪 Testing

```bash
# Unit tests
cd apps/web && npm test

# E2E tests (Playwright)
cd apps/web && npx playwright test

# Frontend API contract checks
./apps/web/tests/frontend_api_contract.sh
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] All UI components and responsive design
- [x] Full backend integration (REST + SignalR)
- [x] Cookie-backed JWT authentication, refresh retry, and Google OAuth
- [x] Two-Factor Authentication (TOTP)
- [x] Real-time chat with image sharing
- [x] In-app notifications
- [x] Seller reviews and ratings
- [x] Admin panel with full moderation
- [x] Multi-language support (EN/AR)
- [x] Dark mode
- [x] Server-side image uploads

### 🔮 Future
- [ ] Payment integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Service Worker for offline support

---

<div align="center">

**Made with ❤️ for the TijarahJo community**

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)

</div>
