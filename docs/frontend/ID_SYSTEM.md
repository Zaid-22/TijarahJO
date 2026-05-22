# TijarahJo ID System Documentation

> [!WARNING]
> **Legacy Document**: This describes the original frontend string-based ID system.
> The backend database now uses **integer primary keys** for all entities.
> The API service layer handles ID translation between frontend representations and backend integers.
> Refer to the [`apps/api/README.md`](../../apps/api/README.md) ERD for the current database schema.

## Overview
TijarahJo originally used a string-based ID system for frontend entities. The backend has since migrated to integer IDs, but some frontend utilities and mock data may still reference this pattern.

## ID Format

### Standard Format
All IDs follow this pattern:
```
{prefix}_{timestamp}_{random}
```

- **prefix**: Entity type identifier (e.g., `user`, `post`, `cat`, `loc`, `img`)
- **timestamp**: Unix timestamp in milliseconds
- **random**: 5-character random string (base36)

### Examples
```
user_1734600000000_a1b2c  // User ID
post_1734600100000_a1b2c  // Post/Product ID
cat_1734600000000_electronics  // Category ID
loc_1734600000000_amman  // Location ID
img_1734600000000_a1b2c  // Image ID
```

## Entity Types

### 1. Users (`user_`)
**Location**: `/data/mockUsers.ts`

Each user has:
- `id`: Unique user identifier
- `email`: User's email address
- `login`: Unique login
- `firstName`: User's first name
- `lastName`: User's last name
- `name`: Full name (concatenation of firstName + lastName)
- `avatar`: Profile picture URL
- `role`: User role (`user` | `admin`)

**Example:**
```typescript
{
  id: "user_1734600000000_a1b2c",
  email: "ahmed.k@example.com",
  login: "ahmedk",
  firstName: "Ahmed",
  lastName: "Khaled",
  name: "Ahmed Khaled",
  avatar: "https://...",
  role: "user"
}
```

### 2. Posts/Products (`post_`)
**Location**: `/data/mockProducts.ts`

Each product has:
- `id`: Unique product identifier
- `sellerId`: Links to user ID
- `categoryId`: Links to category ID
- `locationId`: Links to location ID
- `imageIds`: Array of image entity IDs (optional)
- All other product data (name, price, description, etc.)

**Example:**
```typescript
{
  id: "post_1734600100000_a1b2c",
  name: "iPhone 13 Pro",
  price: 450,
  location: "Amman",
  locationId: "loc_1734600000000_amman",
  seller: "Ahmed Khaled",
  sellerId: "user_1734600000000_a1b2c",
  category: "Electronics",
  categoryId: "cat_1734600000000_electronics",
  image: "https://...",
  phone: "962791234567",
  description: "...",
  createdAt: "2024-12-15T10:00:00Z"
}
```

### 3. Categories (`cat_`)
**Location**: `/data/mockCategories.ts`

Each category has:
- `id`: Unique category identifier
- `name`: Display name
- `slug`: URL-friendly slug
- `image`: Hero image URL
- `description`: Category description

**Example:**
```typescript
{
  id: "cat_1734600000000_electronics",
  name: "Electronics",
  slug: "electronics",
  icon: "Laptop",
  color: "#0A4ABF",
  image: "https://...",
  description: "Phones, laptops, cameras, and more"
}
```

### 4. Locations (`loc_`)
**Location**: `/data/mockLocations.ts`

Each location has:
- `id`: Unique location identifier
- `name`: City name
- `city`: City name (same as name)
- `country`: Country name
- `coordinates`: Lat/lng coordinates (optional)

**Example:**
```typescript
{
  id: "loc_1734600000000_amman",
  name: "Amman",
  city: "Amman",
  country: "Jordan",
  coordinates: {
    lat: 31.9539,
    lng: 35.9106
  }
}
```

### 5. Images (`img_`)
**Type Definition**: `/types/index.ts`

Each image entity has:
- `id`: Unique image identifier
- `url`: Image URL
- `filename`: Original filename (optional)
- `size`: File size in bytes (optional)
- `uploadedAt`: Upload timestamp
- `uploadedBy`: User ID who uploaded (optional)
- `relatedTo`: Post/User ID this image belongs to (optional)
- `relationType`: Type of relation (`post` | `profile` | `other`)

**Example:**
```typescript
{
  id: "img_1734600200000_a1b2c",
  url: "https://...",
  filename: "product-photo.jpg",
  size: 245678,
  uploadedAt: "2024-12-15T10:30:00Z",
  uploadedBy: "user_1734600000000_a1b2c",
  relatedTo: "post_1734600100000_a1b2c",
  relationType: "post"
}
```

## ID Generation Utilities

### Location: `/utils/idGenerator.ts`

#### Functions

**generateId(prefix: string): string**
```typescript
const userId = generateId('user');
// Returns: "user_1734600000000_a1b2c"
```

**generateUUID(): string**
```typescript
const uuid = generateUUID();
// Returns: "550e8400-e29b-41d4-a716-446655440000"
```

**generateShortId(): string**
```typescript
const shortId = generateShortId();
// Returns: "a1b2c3d4"
```

#### ID Generators
```typescript
import { idGenerators } from '../utils/idGenerator';

const userId = idGenerators.user();
const postId = idGenerators.post();
const categoryId = idGenerators.category();
const locationId = idGenerators.location();
const imageId = idGenerators.image();
```

## Helper Functions

### Products
```typescript
import { getProductById, getProductsByCategory, getProductsBySeller } from '../data/mockProducts';

const product = getProductById("post_1734600100000_a1b2c");
const categoryProducts = getProductsByCategory("cat_1734600000000_electronics");
const sellerProducts = getProductsBySeller("user_1734600000000_a1b2c");
```

### Users
```typescript
import { getUserById, getUserByEmail } from '../data/mockUsers';

const user = getUserById("user_1734600000000_a1b2c");
const userByEmail = getUserByEmail("ahmed.k@example.com");
```

### Categories
```typescript
import { getCategoryById, getCategoryByName, getCategoryBySlug } from '../data/mockCategories';

const category = getCategoryById("cat_1734600000000_electronics");
const categoryByName = getCategoryByName("Electronics");
const categoryBySlug = getCategoryBySlug("electronics");
```

### Locations
```typescript
import { getLocationById, getLocationByName } from '../data/mockLocations';

const location = getLocationById("loc_1734600000000_amman");
const locationByName = getLocationByName("Amman");
```

## CRUD Operations

### Create (Add New Entity)
When creating new entities, generate a new ID:

```typescript
import { idGenerators } from '../utils/idGenerator';

const newPost = {
  id: idGenerators.post(),
  name: "New Product",
  price: 100,
  sellerId: currentUser.id,
  categoryId: selectedCategory.id,
  locationId: selectedLocation.id,
  // ... other fields
};
```

### Update (Modify Existing)
Use the existing ID when updating:

```typescript
const updatedPost = {
  ...existingPost,
  price: 150, // Update price
  // ID remains the same
};
```

### Delete (Remove Entity)
Reference by ID:

```typescript
const postToDelete = products.find(p => p.id === "post_1734600100000_a1b2c");
// Remove from array
```

### Filter/Search
Filter by any ID field:

```typescript
// Get all posts by a specific user
const userPosts = products.filter(p => p.sellerId === "user_1734600000000_a1b2c");

// Get all posts in a category
const categoryPosts = products.filter(p => p.categoryId === "cat_1734600000000_electronics");

// Get all posts in a location
const locationPosts = products.filter(p => p.locationId === "loc_1734600000000_amman");
```

## Important Notes

### ✅ DO:
- Always use string IDs, never numbers
- Use the ID generation utilities for new entities
- Link entities using their ID fields (sellerId, categoryId, etc.)
- Keep IDs in state and localStorage for persistence
- Use helper functions to retrieve entities by ID

### ❌ DON'T:
- Display IDs in the user interface
- Manually create IDs (use generators)
- Change existing entity IDs
- Use IDs for sorting (use timestamps instead)
- Store sensitive data in IDs

## Migration from Number IDs

If you encounter old number-based IDs:

```typescript
// ❌ Old (number IDs)
const product = { id: 1, name: "..." };

// ✅ New (string IDs)
const product = { id: "post_1734600100000_a1b2c", name: "..." };
```

## API Integration

When integrating with a backend API:

```typescript
// The API service is already updated to handle string IDs
import { api } from '../services/api';

// Create
const response = await api.products.create(newProduct);
// Returns: { success: true, data: { id: "post_...", ... } }

// Update
await api.products.update(productId, updates);

// Delete
await api.products.delete(productId);
```

## Testing

When writing tests, use realistic ID formats:

```typescript
const mockProduct = {
  id: "post_1734600100000_test1",
  sellerId: "user_1734600000000_test1",
  categoryId: "cat_1734600000000_electronics",
  // ...
};
```

## Performance Considerations

- String IDs are slightly larger than numbers but provide better debugging
- Use Map/Set for O(1) lookups when dealing with large datasets
- Index by ID for fast retrieval

```typescript
// Create an index for fast lookups
const productsById = new Map(products.map(p => [p.id, p]));
const product = productsById.get("post_1734600100000_a1b2c");
```

---

**Last Updated**: 2026-05-22
**Version**: 1.0
**Status**: ✅ Implemented and Ready for Use
