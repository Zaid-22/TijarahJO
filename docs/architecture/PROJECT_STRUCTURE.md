# TijarahJo Project Structure

## 📁 Complete Directory Structure

```
tijarahjo-project/
├── README.md                          # Main project README
├── docs/                              # All documentation
│   ├── setup/                         # Setup guides
│   │   ├── backend-setup.md
│   │   ├── frontend-setup.md
│   │   └── database-setup.md
│   ├── api/                           # API documentation
│   │   └── endpoints.md
│   ├── architecture/                  # Architecture docs
│   │   └── project-structure.md
│   └── troubleshooting/               # Troubleshooting guides
│       └── common-issues.md
│
├── backend/
│   └── TijarahJoDBAPI/
│       ├── src/                       # Source code
│       │   ├── Controllers/           # API Controllers
│       │   │   ├── AuthController.cs
│       │   │   ├── UsersController.cs
│       │   │   ├── UserPostsController.cs
│       │   │   ├── PostImagesController.cs
│       │   │   ├── ItemCategoriesController.cs
│       │   │   └── RolesController.cs
│       │   ├── Services/              # Business services
│       │   │   └── TokenService.cs
│       │   ├── Middleware/            # Custom middleware (future)
│       │   ├── DTOs/                  # Data Transfer Objects
│       │   │   ├── Requests/
│       │   │   └── Responses/
│       │   ├── Models/                # Domain models (shared)
│       │   │   └── JwtOptions.cs
│       │   ├── Utils/                 # Utilities
│       │   │   ├── DTOMapper.cs
│       │   │   └── PasswordHelper.cs
│       │   └── Program.cs
│       ├── DataAccess/                # Data Access Layer (DAL)
│       │   ├── Repositories/         # Data repositories
│       │   │   ├── UserData.cs
│       │   │   ├── PostData.cs
│       │   │   ├── PostImageData.cs
│       │   │   ├── CategoryData.cs
│       │   │   └── RoleData.cs
│       │   └── Settings/
│       │       └── clsDataAccessSettings.cs
│       ├── BusinessLogic/             # Business Logic Layer (BLL)
│       │   └── Services/
│       │       ├── UserBL.cs
│       │       ├── Post.cs
│       │       ├── PostImage.cs
│       │       ├── Category.cs
│       │       └── Role.cs
│       ├── Models/                    # Domain Models
│       │   ├── UserModel.cs
│       │   ├── PostModel.cs
│       │   ├── PostImageModel.cs
│       │   ├── CategoryModel.cs
│       │   └── RoleModel.cs
│       ├── database/                  # Database related files
│       │   ├── scripts/
│       │   │   ├── setup/             # Initial setup scripts
│       │   │   │   ├── COMPLETE_DATABASE_SETUP.sql
│       │   │   │   ├── SETUP_ALL_STORED_PROCEDURES.sql
│       │   │   │   └── CREATE_SP_*.sql
│       │   │   ├── migrations/        # Migration scripts
│       │   │   │   ├── CHECK_AND_CLEAN_DUPLICATES.sql
│       │   │   │   └── CLEANUP_TEST_DATA.sql
│       │   │   └── seeds/            # Test data
│       │   │       ├── CREATE_TEST_USER.sql
│       │   │       └── INSERT_SAMPLE_POSTS.sql
│       │   └── backups/              # Database backups
│       │       └── TijarahJoDB.bak
│       ├── docs/                      # Backend documentation
│       │   ├── diagrams/             # ERD diagrams
│       │   └── *.md                  # Backend-specific docs
│       └── TijarahJoDBAPI.sln
│
└── frontend/
    ├── public/                        # Static assets
    ├── src/
    │   ├── app/                       # App entry point
    │   │   ├── App.tsx
    │   │   └── main.tsx
    │   ├── features/                  # Feature-based organization
    │   │   ├── auth/
    │   │   │   └── pages/
    │   │   │       └── LoginPage.tsx
    │   │   ├── posts/
    │   │   │   └── components/
    │   │   │       ├── ProductCard.tsx
    │   │   │       ├── ProductCardSkeleton.tsx
    │   │   │       ├── ProductDetailsPage.tsx
    │   │   │       ├── SellItemPage.tsx
    │   │   │       ├── SellItemDialog.tsx
    │   │   │       ├── EditProductDialog.tsx
    │   │   │       └── AllProductsPage.tsx
    │   │   ├── profile/
    │   │   │   └── pages/
    │   │   │       ├── ProfilePage.tsx
    │   │   │       ├── EditProfilePage.tsx
    │   │   │       └── SettingsPage.tsx
    │   │   ├── categories/
    │   │   │   └── pages/
    │   │   │       ├── CategoryPage.tsx
    │   │   │       ├── ElectronicsPage.tsx
    │   │   │       ├── MobilePhonesTabletsPage.tsx
    │   │   │       └── [other category pages]
    │   │   └── search/
    │   │       └── pages/
    │   │           └── SearchResultsPage.tsx
    │   ├── shared/                     # Shared code
    │   │   ├── components/
    │   │   │   ├── ui/                # Reusable UI components
    │   │   │   │   ├── button.tsx
    │   │   │   │   ├── input.tsx
    │   │   │   │   └── [all shadcn components]
    │   │   │   ├── layout/            # Layout components
    │   │   │   │   ├── Header.tsx
    │   │   │   │   └── Footer.tsx
    │   │   │   └── ImageWithFallback.tsx
    │   │   ├── services/
    │   │   │   ├── api/               # API services (to be split)
    │   │   │   │   └── apiClient.ts  # Base API client
    │   │   │   └── apiClient.ts       # Main API service
    │   │   ├── hooks/                 # Shared React hooks
    │   │   │   ├── useDebounce.ts
    │   │   │   ├── useFavorites.ts
    │   │   │   ├── useInfiniteScroll.ts
    │   │   │   ├── useLocalStorage.ts
    │   │   │   └── useNavigationHistory.ts
    │   │   ├── contexts/             # React contexts
    │   │   │   └── AuthContext.tsx
    │   │   ├── types/                # TypeScript types
    │   │   │   ├── api.ts
    │   │   │   ├── database.ts
    │   │   │   └── index.ts
    │   │   ├── utils/                # Utility functions
    │   │   │   ├── categoryTranslations.ts
    │   │   │   ├── idGenerator.ts
    │   │   │   ├── shareUtils.ts
    │   │   │   └── index.ts
    │   │   └── constants/           # Constants
    │   │       ├── categoryData.ts   # ✅ KEPT - Category data
    │   │       ├── mockCategories.ts # ✅ KEPT - Category mocks
    │   │       └── index.ts
    │   ├── styles/
    │   │   └── globals.css
    │   └── translations.ts
    ├── package.json
    └── vite.config.ts
```

## 📝 Key Organizational Principles

### 1. Feature-Based Frontend Structure

- Each feature (auth, posts, profile, etc.) has its own folder
- Contains feature-specific components, pages, and hooks
- Promotes code reusability and maintainability

### 2. Shared Code Separation

- `shared/` contains code used across multiple features
- UI components, utilities, hooks, contexts
- API services and types

### 3. Backend Layered Architecture

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **DataAccess**: Database operations
- **BusinessLogic**: Domain logic
- **Models**: Data models

### 4. Database Organization

- Scripts organized by purpose (setup, migrations, seeds)
- Backups in dedicated folder
- Documentation with diagrams

## 🔄 Import Path Updates

After restructuring, update imports:

### Frontend:

```typescript
// Old
import { categoryData } from "./data/categoryData";
import { Button } from "./components/ui/button";
import { useAuth } from "./contexts/AuthContext";

// New
import { categoryData } from "./shared/constants/categoryData";
import { Button } from "./shared/components/ui/button";
import { useAuth } from "./shared/contexts/AuthContext";
```

### Component Imports:

```typescript
// Old
import { LoginPage } from "./components/figma/LoginPage";
import { ProductCard } from "./components/figma/ProductCard";

// New
import { LoginPage } from "./features/auth/pages/LoginPage";
import { ProductCard } from "./features/posts/components/ProductCard";
```

## ✅ Files Preserved

- ✅ `categoryData.ts` - Moved to `shared/constants/`
- ✅ `mockCategories.ts` - Moved to `shared/constants/`
- ✅ All UI components - Moved to `shared/components/ui/`
- ✅ All hooks - Moved to `shared/hooks/`
- ✅ All contexts - Moved to `shared/contexts/`

## 🗑️ Files That Can Be Removed (After Verification)

- `data/mockProducts.ts` - If not used
- `data/mockProducts.new.ts` - If not used
- `data/mockUsers.ts` - If not used (check App.tsx)
- `data/mockLocations.ts` - If not used
