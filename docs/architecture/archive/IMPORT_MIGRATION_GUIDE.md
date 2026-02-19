# Import Path Migration Guide

After restructuring, update all import paths in your codebase.

## 📋 Import Path Changes

### Constants & Data
```typescript
// OLD
import { categoryData } from "./data/categoryData";
import { mockCategories } from "./data/mockCategories";

// NEW
import { categoryData } from "./shared/constants/categoryData";
import { mockCategories } from "./shared/constants/mockCategories";
```

### Components - UI
```typescript
// OLD
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

// NEW
import { Button } from "./shared/components/ui/button";
import { Input } from "./shared/components/ui/input";
```

### Components - Layout
```typescript
// OLD
import { Header } from "./components/figma/Header";
import { Footer } from "./components/figma/Footer";

// NEW
import { Header } from "./shared/components/layout/Header";
import { Footer } from "./shared/components/layout/Footer";
```

### Components - Features
```typescript
// OLD
import { LoginPage } from "./components/figma/LoginPage";
import { ProductCard } from "./components/figma/ProductCard";
import { ProfilePage } from "./components/figma/ProfilePage";

// NEW
import { LoginPage } from "./features/auth/pages/LoginPage";
import { ProductCard } from "./features/posts/components/ProductCard";
import { ProfilePage } from "./features/profile/pages/ProfilePage";
```

### Hooks
```typescript
// OLD
import { useAuth } from "./contexts/AuthContext";
import { useDebounce } from "./hooks/useDebounce";

// NEW
import { useAuth } from "./shared/contexts/AuthContext";
import { useDebounce } from "./shared/hooks/useDebounce";
```

### Services
```typescript
// OLD
import { api } from "./services/api";

// NEW
import { api } from "./shared/services/apiClient";
```

### Types
```typescript
// OLD
import { Product } from "./types";
import { UserProfile } from "./types";

// NEW
import { Product, UserProfile } from "./shared/types";
```

### Utils
```typescript
// OLD
import { shareUtils } from "./utils/shareUtils";

// NEW
import { shareUtils } from "./shared/utils/shareUtils";
```

## 🔍 Files to Update

### Priority 1 (Core Files):
1. `App.tsx` - Main application file
2. `main.tsx` - Entry point
3. All page components
4. All feature components

### Priority 2 (Supporting Files):
1. Component files that import other components
2. Hook files
3. Utility files
4. Service files

## ✅ Automated Update Script

You can use find/replace in your IDE:

1. Find: `from "./data/categoryData"`
   Replace: `from "./shared/constants/categoryData"`

2. Find: `from "./components/figma/`
   Replace: `from "./features/[feature]/` (manual review needed)

3. Find: `from "./components/ui/`
   Replace: `from "./shared/components/ui/`

4. Find: `from "./contexts/`
   Replace: `from "./shared/contexts/`

5. Find: `from "./hooks/`
   Replace: `from "./shared/hooks/`

6. Find: `from "./services/api"`
   Replace: `from "./shared/services/apiClient"`

7. Find: `from "./types"`
   Replace: `from "./shared/types"`

8. Find: `from "./utils/`
   Replace: `from "./shared/utils/`

## ⚠️ Important Notes

- **categoryData.ts** is preserved and moved to `shared/constants/`
- **mockCategories.ts** is preserved and moved to `shared/constants/`
- Review each import manually to ensure correct feature path
- Test after each batch of changes

