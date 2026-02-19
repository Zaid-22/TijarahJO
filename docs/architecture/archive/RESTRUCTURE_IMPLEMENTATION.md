> [!WARNING]
> Historical restructure/planning document. The canonical current layout is in `CURRENT_STRUCTURE_2026.md`.

# TijarahJo Project Restructure - Implementation Guide

## 🎯 Phase 1: Create New Folder Structure

### Step 1: Create Documentation Structure
```
docs/
├── setup/
├── api/
├── architecture/
└── troubleshooting/
```

### Step 2: Create Backend Structure
```
backend/TijarahJoDBAPI/
├── database/
│   ├── scripts/
│   │   ├── setup/
│   │   ├── migrations/
│   │   └── seeds/
│   └── backups/
└── docs/
    └── diagrams/
```

### Step 3: Create Frontend Structure
```
frontend/src/
├── features/
│   ├── auth/
│   ├── posts/
│   ├── profile/
│   ├── categories/
│   └── search/
└── shared/
    ├── components/
    ├── services/
    └── ...
```

## 📋 Files to Keep (DO NOT DELETE)

### Frontend - Keep These:
- ✅ `data/categoryData.ts` - **KEEP** (used for category display)
- ✅ `data/mockCategories.ts` - **KEEP** (if used with categoryData)
- ✅ All UI components in `components/ui/`
- ✅ All hooks in `hooks/`
- ✅ All contexts in `contexts/`

### Frontend - Can Remove (if not used):
- ❌ `data/mockProducts.ts` - Check if used
- ❌ `data/mockProducts.new.ts` - Check if used
- ❌ `data/mockUsers.ts` - Check if used (only if not needed)
- ❌ `data/mockLocations.ts` - Check if used

## 🔄 Migration Checklist

### Backend:
- [ ] Move SQL scripts to `database/scripts/setup/`
- [ ] Move database backups to `database/backups/`
- [ ] Consolidate documentation to `docs/`
- [ ] Remove duplicate Models folder
- [ ] Organize Controllers by domain

### Frontend:
- [ ] Split `api.ts` into domain-specific files
- [ ] Organize components by feature
- [ ] Move pages to feature folders
- [ ] Consolidate documentation
- [ ] Keep categoryData.ts in appropriate location

## 📝 Import Path Updates Needed

After moving files, update imports:
- `./data/categoryData` → `./shared/constants/categoryData` or `./features/categories/constants`
- `./components/figma/` → `./features/[feature]/components/` or `./shared/components/`
- `./services/api` → `./shared/services/api/[domain].api`

