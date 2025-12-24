# TijarahJo Project Restructure Plan

## 📋 Current Issues Analysis

### Frontend Issues:

1. **Components Organization**: All components in single `figma/` folder - should be organized by feature
2. **Mock Data**: Multiple mock data files that may not be needed in production
3. **Documentation Scattered**: Multiple MD files in root and subdirectories
4. **Large API File**: Single `api.ts` file (1700+ lines) - should be split by domain
5. **Types Organization**: Types split across multiple files

### Backend Issues:

1. **SQL Files Scattered**: SQL scripts in root directory - should be in `database/scripts/`
2. **Documentation Scattered**: Multiple troubleshooting/fix MD files
3. **Duplicate Models**: Models exist in both root `Models/` and `TijarahJoDBAPI/Models/`
4. **Build Artifacts**: `bin/` and `obj/` folders should be gitignored
5. **No Middleware Folder**: Middleware logic scattered

### Root Issues:

1. **Too Many MD Files**: 15+ markdown files in root
2. **No Clear Docs Structure**: Documentation should be in `/docs`

## 🎯 Proposed New Structure

```
tijarahjo-project/
├── README.md                          # Main project README
├── .gitignore                         # Updated gitignore
├── docs/                              # All documentation
│   ├── setup/
│   │   ├── backend-setup.md
│   │   ├── frontend-setup.md
│   │   └── database-setup.md
│   ├── api/
│   │   └── endpoints.md
│   ├── architecture/
│   │   └── project-structure.md
│   └── troubleshooting/
│       └── common-issues.md
│
├── backend/
│   └── TijarahJoDBAPI/
│       ├── src/
│       │   ├── Controllers/          # API Controllers
│       │   ├── Services/             # Business services
│       │   ├── Middleware/           # Custom middleware
│       │   ├── DTOs/                 # Data Transfer Objects
│       │   ├── Models/               # Domain models (shared)
│       │   ├── Utils/                # Utilities
│       │   └── Program.cs
│       ├── DataAccess/               # Renamed from DAL
│       │   ├── Repositories/        # Data repositories
│       │   └── Settings/
│       ├── BusinessLogic/            # Renamed from BLL
│       │   └── Services/
│       ├── database/
│       │   ├── scripts/
│       │   │   ├── setup/
│       │   │   ├── migrations/
│       │   │   └── seeds/
│       │   └── backups/
│       └── docs/
│           └── diagrams/
│
└── frontend/
    ├── public/                       # Static assets
    ├── src/
    │   ├── app/                      # App entry point
    │   │   ├── App.tsx
    │   │   └── main.tsx
    │   ├── features/                 # Feature-based organization
    │   │   ├── auth/
    │   │   │   ├── components/
    │   │   │   ├── pages/
    │   │   │   └── hooks/
    │   │   ├── posts/
    │   │   │   ├── components/
    │   │   │   ├── pages/
    │   │   │   └── hooks/
    │   │   ├── profile/
    │   │   ├── categories/
    │   │   └── search/
    │   ├── shared/                   # Shared components
    │   │   ├── components/
    │   │   │   ├── ui/               # UI components
    │   │   │   └── layout/           # Layout components
    │   │   ├── hooks/
    │   │   ├── contexts/
    │   │   ├── services/
    │   │   │   ├── api/
    │   │   │   │   ├── auth.api.ts
    │   │   │   │   ├── posts.api.ts
    │   │   │   │   ├── users.api.ts
    │   │   │   │   └── index.ts
    │   │   │   └── apiClient.ts
    │   │   ├── types/
    │   │   ├── utils/
    │   │   └── constants/
    │   └── styles/
    └── docs/
```

## 📝 Detailed Structure Explanation

### Backend Structure

#### `/src/Controllers/`

- API endpoints organized by domain
- Each controller handles one resource

#### `/src/Services/`

- Business logic services
- TokenService, EmailService, etc.

#### `/src/Middleware/`

- Custom middleware (auth, logging, error handling)

#### `/DataAccess/` (formerly DAL)

- Data access layer
- Repository pattern implementation
- Database connection settings

#### `/BusinessLogic/` (formerly BLL)

- Business logic layer
- Domain services

#### `/database/scripts/`

- `setup/` - Initial database setup scripts
- `migrations/` - Database migration scripts
- `seeds/` - Test data seeding scripts
- `backups/` - Database backups

### Frontend Structure

#### `/src/features/`

Feature-based organization:

- Each feature has its own folder
- Contains components, pages, hooks specific to that feature
- Promotes code reusability and maintainability

#### `/src/shared/`

Shared code used across features:

- `components/ui/` - Reusable UI components
- `components/layout/` - Layout components (Header, Footer)
- `services/api/` - Split API services by domain
- `hooks/` - Shared React hooks
- `contexts/` - React contexts
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

## 🗑️ Files to Remove/Archive

### Frontend:

- `data/mockProducts.ts` - If not used
- `data/mockProducts.new.ts` - If not used
- `data/mockUsers.ts` - If not used
- `data/mockCategories.ts` - If not used
- `docs/` folder - Move to root `/docs`

### Backend:

- Root level `Models/` folder (duplicate)
- All scattered `.md` files - Consolidate to `/docs`
- `request.http` - Move to `/docs/api/` or remove if not needed

### Root:

- All `.md` files except main `README.md` - Move to `/docs`
- Consolidate similar documentation files

## 🔄 Migration Steps

1. **Create new folder structure**
2. **Move files to new locations**
3. **Update import paths**
4. **Update configuration files**
5. **Test all functionality**
6. **Update documentation**

## ✅ Benefits

1. **Better Organization**: Clear separation of concerns
2. **Scalability**: Easy to add new features
3. **Maintainability**: Easier to find and modify code
4. **Team Collaboration**: Clear structure for multiple developers
5. **Documentation**: Centralized documentation location
