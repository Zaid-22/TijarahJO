# Project Restructure Checklist

## ✅ Completed
- [x] Created documentation folder structure
- [x] Created backend database scripts folder structure
- [x] Created frontend feature-based folder structure
- [x] Created shared code folder structure
- [x] Preserved categoryData.ts in new location
- [x] Preserved mockCategories.ts in new location
- [x] Created comprehensive documentation
- [x] Created .gitignore file

## 📋 To Do

### Backend
- [ ] Move SQL scripts to database/scripts/setup/
- [ ] Move migration scripts to database/scripts/migrations/
- [ ] Move seed scripts to database/scripts/seeds/
- [ ] Move database backups to database/backups/
- [ ] Move diagrams to docs/diagrams/

### Frontend - File Movement
- [ ] Move App.tsx to src/app/
- [ ] Move main.tsx to src/app/
- [ ] Move contexts/* to src/shared/contexts/
- [ ] Move hooks/* to src/shared/hooks/
- [ ] Move utils/* to src/shared/utils/
- [ ] Move types/* to src/shared/types/
- [ ] Move components/ui/* to src/shared/components/ui/
- [ ] Move components/figma/Header.tsx to src/shared/components/layout/
- [ ] Move components/figma/Footer.tsx to src/shared/components/layout/
- [ ] Move LoginPage.tsx to src/features/auth/pages/
- [ ] Move post components to src/features/posts/components/
- [ ] Move profile pages to src/features/profile/pages/
- [ ] Move category pages to src/features/categories/pages/
- [ ] Move SearchResultsPage.tsx to src/features/search/pages/
- [ ] Move services/api.ts to src/shared/services/apiClient.ts

### Frontend - Code Updates
- [ ] Update all import paths in App.tsx
- [ ] Update all import paths in component files
- [ ] Update all import paths in page files
- [ ] Split api.ts into domain-specific files
- [ ] Update vite.config.ts with new aliases
- [ ] Update tsconfig.json with new paths

### Testing
- [ ] Test application compilation
- [ ] Test all features work
- [ ] Test category data loads
- [ ] Test authentication
- [ ] Test post creation
- [ ] Test profile editing
- [ ] Test search functionality

### Cleanup
- [ ] Remove old empty directories
- [ ] Remove unused mock data files (if any)
- [ ] Update README.md
- [ ] Final verification

## 📚 Documentation Location

All guides are in `docs/architecture/`:
- PROJECT_STRUCTURE.md
- IMPORT_MIGRATION_GUIDE.md
- COMPLETE_RESTRUCTURE_GUIDE.md
- FINAL_STRUCTURE.md
