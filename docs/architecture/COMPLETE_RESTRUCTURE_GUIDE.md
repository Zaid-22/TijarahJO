# Complete Project Restructure Guide

## 📋 Overview

This guide provides a complete restructuring plan for the TijarahJo project to improve organization, maintainability, and scalability.

## ✅ What Has Been Done

### 1. Folder Structure Created
- ✅ Documentation folder (`docs/`) with subfolders
- ✅ Backend database scripts organized
- ✅ Frontend feature-based structure created
- ✅ Shared code folders created

### 2. Files Already Moved
- ✅ `categoryData.ts` → `src/shared/constants/categoryData.ts` ✅ **PRESERVED**
- ✅ `mockCategories.ts` → `src/shared/constants/mockCategories.ts` ✅ **PRESERVED**
- ✅ SQL scripts organized in `database/scripts/`
- ✅ Documentation files moved to `docs/`

## 📝 What Needs to Be Done

### Phase 1: Move Remaining Files

#### Frontend Files to Move:

```bash
# 1. Move entry point files
mv TijarahJo-frontend/App.tsx TijarahJo-frontend/src/app/
mv TijarahJo-frontend/main.tsx TijarahJo-frontend/src/app/

# 2. Move shared code (if not already moved)
mv TijarahJo-frontend/contexts/* TijarahJo-frontend/src/shared/contexts/
mv TijarahJo-frontend/hooks/* TijarahJo-frontend/src/shared/hooks/
mv TijarahJo-frontend/utils/* TijarahJo-frontend/src/shared/utils/
mv TijarahJo-frontend/types/* TijarahJo-frontend/src/shared/types/
mv TijarahJo-frontend/constants/* TijarahJo-frontend/src/shared/constants/

# 3. Move UI components
mv TijarahJo-frontend/components/ui/* TijarahJo-frontend/src/shared/components/ui/

# 4. Move layout components
mv TijarahJo-frontend/components/figma/Header.tsx TijarahJo-frontend/src/shared/components/layout/
mv TijarahJo-frontend/components/figma/Footer.tsx TijarahJo-frontend/src/shared/components/layout/
mv TijarahJo-frontend/components/figma/ImageWithFallback.tsx TijarahJo-frontend/src/shared/components/

# 5. Move feature components
# Auth
mv TijarahJo-frontend/components/figma/LoginPage.tsx TijarahJo-frontend/src/features/auth/pages/

# Posts
mv TijarahJo-frontend/components/figma/ProductCard.tsx TijarahJo-frontend/src/features/posts/components/
mv TijarahJo-frontend/components/figma/ProductCardSkeleton.tsx TijarahJo-frontend/src/features/posts/components/
mv TijarahJo-frontend/components/figma/ProductDetailsPage.tsx TijarahJo-frontend/src/features/posts/components/
mv TijarahJo-frontend/components/figma/SellItemPage.tsx TijarahJo-frontend/src/features/posts/components/
mv TijarahJo-frontend/components/figma/SellItemDialog.tsx TijarahJo-frontend/src/features/posts/components/
mv TijarahJo-frontend/components/figma/EditProductDialog.tsx TijarahJo-frontend/src/features/posts/components/
mv TijarahJo-frontend/components/figma/AllProductsPage.tsx TijarahJo-frontend/src/features/posts/components/

# Profile
mv TijarahJo-frontend/components/figma/ProfilePage.tsx TijarahJo-frontend/src/features/profile/pages/
mv TijarahJo-frontend/components/figma/EditProfilePage.tsx TijarahJo-frontend/src/features/profile/pages/
mv TijarahJo-frontend/components/figma/SettingsPage.tsx TijarahJo-frontend/src/features/profile/pages/

# Categories
mv TijarahJo-frontend/components/figma/CategoryPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/ElectronicsPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/MobilePhonesTabletsPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/ComputersLaptopsPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/HomeAppliancesPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/FurniturePage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/VehiclesPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/FashionClothingPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/HealthBeautyPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/SportsFitnessPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/BooksStationeryPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/ToysGamesPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/RealEstatePage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/PetsAnimalsPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/ServicesPage.tsx TijarahJo-frontend/src/features/categories/pages/
mv TijarahJo-frontend/components/figma/OtherPage.tsx TijarahJo-frontend/src/features/categories/pages/

# Search
mv TijarahJo-frontend/components/figma/SearchResultsPage.tsx TijarahJo-frontend/src/features/search/pages/

# Other
mv TijarahJo-frontend/components/figma/FavoritesPage.tsx TijarahJo-frontend/src/features/posts/pages/
mv TijarahJo-frontend/components/figma/SellerProfilePage.tsx TijarahJo-frontend/src/features/profile/pages/
mv TijarahJo-frontend/components/figma/Logo.tsx TijarahJo-frontend/src/shared/components/
mv TijarahJo-frontend/components/figma/WhatsAppIcon.tsx TijarahJo-frontend/src/shared/components/

# 6. Move services
mv TijarahJo-frontend/services/api.ts TijarahJo-frontend/src/shared/services/apiClient.ts

# 7. Move styles
mv TijarahJo-frontend/styles TijarahJo-frontend/src/

# 8. Move translations
mv TijarahJo-frontend/translations.ts TijarahJo-frontend/src/shared/constants/
```

### Phase 2: Update Import Paths

See `IMPORT_MIGRATION_GUIDE.md` for detailed import path updates.

### Phase 3: Split API Service

The large `api.ts` file should be split into:

1. `src/shared/services/api/auth.api.ts` - Authentication endpoints
2. `src/shared/services/api/posts.api.ts` - Posts endpoints
3. `src/shared/services/api/users.api.ts` - User endpoints
4. `src/shared/services/api/categories.api.ts` - Category endpoints
5. `src/shared/services/api/images.api.ts` - Image endpoints
6. `src/shared/services/api/index.ts` - Exports all APIs

### Phase 4: Update Configuration

#### Update `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@shared': path.resolve(__dirname, './src/shared'),
    '@features': path.resolve(__dirname, './src/features'),
  },
}
```

#### Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@features/*": ["./src/features/*"]
    }
  }
}
```

## 🎯 Benefits

1. **Better Organization**: Clear separation by feature and concern
2. **Scalability**: Easy to add new features
3. **Maintainability**: Easier to find and modify code
4. **Team Collaboration**: Clear structure for multiple developers
5. **Documentation**: Centralized documentation location

## ⚠️ Important Notes

- ✅ **categoryData.ts is PRESERVED** in `src/shared/constants/`
- ✅ **mockCategories.ts is PRESERVED** in `src/shared/constants/`
- All UI components preserved
- All hooks preserved
- All contexts preserved

## 🔍 Verification Steps

After completing the restructuring:

1. **Check Imports**: Run `npm run build` or `npm run dev` to check for import errors
2. **Test Features**: Test each feature (auth, posts, profile, categories, search)
3. **Check Category Data**: Verify categoryData loads correctly
4. **Check API Calls**: Verify all API endpoints work
5. **Check Navigation**: Verify all navigation works

## 📚 Documentation Files Created

1. `PROJECT_RESTRUCTURE_PLAN.md` - Initial plan
2. `PROJECT_STRUCTURE.md` - Complete structure explanation
3. `IMPORT_MIGRATION_GUIDE.md` - Import path updates
4. `RESTRUCTURE_SUMMARY.md` - Summary of changes
5. `FINAL_STRUCTURE.md` - Final directory tree
6. `COMPLETE_RESTRUCTURE_GUIDE.md` - This file

All documentation is in `docs/architecture/` folder.

