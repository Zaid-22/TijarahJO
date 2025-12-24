# TijarahJo - Final Clean Project Structure

## 📁 Complete Directory Tree

```
tijarahjo-project/
├── README.md
├── docs/                                    # 📚 ALL DOCUMENTATION
│   ├── setup/
│   │   ├── backend-setup.md
│   │   ├── frontend-setup.md
│   │   ├── database-setup.md
│   │   └── azure-data-studio-setup.md
│   ├── api/
│   │   └── endpoints.md
│   ├── architecture/
│   │   ├── project-structure.md
│   │   ├── import-migration-guide.md
│   │   └── restructure-summary.md
│   └── troubleshooting/
│       ├── debugging-guide.md
│       ├── critical-fixes.md
│       └── common-issues.md
│
├── backend/
│   └── TijarahJoDBAPI/
│       ├── src/                            # Source code
│       │   └── TijarahJoDBAPI/
│       │       ├── Controllers/            # ✅ API Controllers
│       │       ├── Services/                # ✅ Business Services
│       │       ├── DTOs/                    # ✅ Data Transfer Objects
│       │       ├── Utils/                   # ✅ Utilities
│       │       └── Program.cs
│       ├── DataAccess/                      # ✅ DAL (Data Access Layer)
│       │   ├── UserData.cs
│       │   ├── PostData.cs
│       │   ├── PostImageData.cs
│       │   ├── CategoryData.cs
│       │   ├── RoleData.cs
│       │   └── clsDataAccessSettings.cs
│       ├── BusinessLogic/                  # ✅ BLL (Business Logic Layer)
│       │   ├── UserBL.cs
│       │   ├── Post.cs
│       │   ├── PostImage.cs
│       │   ├── Category.cs
│       │   └── Role.cs
│       ├── Models/                         # ✅ Domain Models
│       │   ├── UserModel.cs
│       │   ├── PostModel.cs
│       │   ├── PostImageModel.cs
│       │   ├── CategoryModel.cs
│       │   └── RoleModel.cs
│       ├── database/                       # ✅ Database Files
│       │   ├── scripts/
│       │   │   ├── setup/                  # Initial setup
│       │   │   │   ├── COMPLETE_DATABASE_SETUP.sql
│       │   │   │   ├── SETUP_ALL_STORED_PROCEDURES.sql
│       │   │   │   └── CREATE_SP_*.sql
│       │   │   ├── migrations/             # Database migrations
│       │   │   │   ├── CHECK_AND_CLEAN_DUPLICATES.sql
│       │   │   │   └── CLEANUP_TEST_DATA.sql
│       │   │   └── seeds/                  # Test data
│       │   │       ├── CREATE_TEST_USER.sql
│       │   │       └── INSERT_SAMPLE_POSTS.sql
│       │   └── backups/                    # Database backups
│       │       └── TijarahJoDB.bak
│       └── docs/                           # Backend docs
│           └── diagrams/                    # ERD diagrams
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── app/                            # ✅ App Entry Point
    │   │   ├── App.tsx
    │   │   └── main.tsx
    │   ├── features/                       # ✅ Feature-Based Organization
    │   │   ├── auth/
    │   │   │   └── pages/
    │   │   │       └── LoginPage.tsx
    │   │   ├── posts/
    │   │   │   ├── components/
    │   │   │   │   ├── ProductCard.tsx
    │   │   │   │   ├── ProductCardSkeleton.tsx
    │   │   │   │   ├── ProductDetailsPage.tsx
    │   │   │   │   ├── SellItemPage.tsx
    │   │   │   │   ├── SellItemDialog.tsx
    │   │   │   │   ├── EditProductDialog.tsx
    │   │   │   │   └── AllProductsPage.tsx
    │   │   │   └── pages/
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
    │   └── shared/                         # ✅ Shared Code
    │       ├── components/
    │       │   ├── ui/                     # ✅ UI Components (shadcn)
    │       │   │   ├── button.tsx
    │       │   │   ├── input.tsx
    │       │   │   └── [50+ components]
    │       │   ├── layout/                 # ✅ Layout Components
    │       │   │   ├── Header.tsx
    │       │   │   └── Footer.tsx
    │       │   └── ImageWithFallback.tsx
    │       ├── services/
    │       │   ├── api/                    # API Services (to be split)
    │       │   └── apiClient.ts            # Main API client
    │       ├── hooks/                      # ✅ React Hooks
    │       │   ├── useDebounce.ts
    │       │   ├── useFavorites.ts
    │       │   ├── useInfiniteScroll.ts
    │       │   ├── useLocalStorage.ts
    │       │   └── useNavigationHistory.ts
    │       ├── contexts/                   # ✅ React Contexts
    │       │   └── AuthContext.tsx
    │       ├── types/                      # ✅ TypeScript Types
    │       │   ├── api.ts
    │       │   ├── database.ts
    │       │   └── index.ts
    │       ├── utils/                      # ✅ Utilities
    │       │   ├── categoryTranslations.ts
    │       │   ├── idGenerator.ts
    │       │   ├── shareUtils.ts
    │       │   └── index.ts
    │       └── constants/                  # ✅ Constants
    │           ├── categoryData.ts          # ✅ PRESERVED
    │           ├── mockCategories.ts       # ✅ PRESERVED
    │           └── index.ts
    ├── styles/
    │   └── globals.css
    └── translations.ts
```

## 🎯 Key Organizational Principles

### 1. **Feature-Based Frontend**
- Each feature (auth, posts, profile, categories, search) has its own folder
- Contains feature-specific components and pages
- Promotes code reusability and maintainability

### 2. **Shared Code Separation**
- `shared/` contains code used across multiple features
- UI components, utilities, hooks, contexts
- API services and types

### 3. **Backend Layered Architecture**
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic (TokenService, etc.)
- **DataAccess**: Database operations (DAL)
- **BusinessLogic**: Domain logic (BLL)
- **Models**: Data models

### 4. **Database Organization**
- Scripts organized by purpose:
  - `setup/` - Initial database setup
  - `migrations/` - Database migrations
  - `seeds/` - Test data seeding
- Backups in dedicated folder
- Documentation with diagrams

## ✅ Files Preserved

### Category Data (As Requested):
- ✅ `categoryData.ts` → `src/shared/constants/categoryData.ts`
- ✅ `mockCategories.ts` → `src/shared/constants/mockCategories.ts`

### All Other Important Files:
- ✅ All UI components → `src/shared/components/ui/`
- ✅ All hooks → `src/shared/hooks/`
- ✅ All contexts → `src/shared/contexts/`
- ✅ All types → `src/shared/types/`
- ✅ All utils → `src/shared/utils/`

## 📝 Next Steps

1. **Move remaining files** to new structure
2. **Update import paths** using the migration guide
3. **Split large api.ts** into domain-specific files
4. **Test application** to ensure everything works
5. **Remove old empty directories**

## 🔍 Verification

After restructuring, verify:
- ✅ Category data loads correctly
- ✅ All imports resolve
- ✅ Application compiles
- ✅ All features work
- ✅ No broken imports

