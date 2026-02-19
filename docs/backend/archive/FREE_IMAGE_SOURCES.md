# Free Image Sources for Product Images

This document lists free image sources that can be used for product images in the TijarahJo marketplace.

## Best Free Image Sources

### 1. **Unsplash** ⭐ (Currently Used)
- **URL Format**: `https://images.unsplash.com/photo-{photo-id}?w=800&h=600&fit=crop`
- **License**: Free for commercial use, no attribution required
- **Best For**: High-quality product photos, electronics, furniture
- **Website**: https://unsplash.com
- **API**: Available with registration (free tier)

### 2. **Pexels**
- **URL Format**: Direct image URLs from their CDN
- **License**: Free for commercial use, no attribution required
- **Best For**: General product photos, lifestyle images
- **Website**: https://www.pexels.com
- **API**: Available with free API key

### 3. **Pixabay**
- **URL Format**: Direct image URLs
- **License**: Free for commercial use (Pixabay License)
- **Best For**: Diverse product images, illustrations
- **Website**: https://pixabay.com
- **API**: Available with free API key (rate limited)

### 4. **Burst by Shopify**
- **License**: Free for commercial use
- **Best For**: E-commerce product photos
- **Website**: https://burst.shopify.com
- **Note**: Download and host yourself (no direct URLs)

### 5. **StockSnap**
- **License**: CCO (Public Domain)
- **Best For**: General stock photos
- **Website**: https://stocksnap.io
- **Note**: Download and host yourself

## Current Implementation

The SQL script uses **Unsplash** images with specific photo IDs that match each product type:

- **iPhone**: Phone/product images
- **MacBook**: Laptop/computer images  
- **TV**: Television/display images
- **Sofa**: Furniture/home images
- **Dining Table**: Table/furniture images
- **PlayStation**: Gaming console images
- **Office Desk**: Office furniture images
- **Samsung Phone**: Mobile phone images
- **Coffee Table**: Furniture/home images
- **AirPods**: Headphone/audio images
- **Bookshelf**: Furniture/storage images
- **Gaming Chair**: Chair/furniture images
- **iPad**: Tablet/product images
- **Wardrobe**: Furniture/storage images
- **Apple Watch**: Watch/wearable images

## How to Update Images

### Option 1: Use Unsplash Search
1. Go to https://unsplash.com
2. Search for your product (e.g., "iPhone 15")
3. Click on an image
4. Copy the image URL from the browser
5. Update the SQL script with the new URL

### Option 2: Use Unsplash API
1. Register at https://unsplash.com/developers
2. Get a free API key
3. Search for images programmatically
4. Use the returned URLs

### Option 3: Host Your Own Images
1. Upload images to your server/cloud storage
2. Update URLs in the database to point to your hosted images
3. Best for production use

## Image URL Format in Database

All image URLs are stored in the `TbPostImages` table:
- **Column**: `PostImageURL`
- **Type**: `NVARCHAR(500)`
- **Format**: Full HTTPS URL to the image

## Notes

- **Unsplash images** used in the script are real product photos from Unsplash
- All images are **800x600 pixels** with crop fit for consistent display
- Images load directly from Unsplash CDN (no local storage needed)
- For production, consider hosting images yourself for better control and performance

## Troubleshooting

If images don't load:
1. Check if the URL is accessible in a browser
2. Verify CORS settings (Unsplash allows cross-origin)
3. Check network connectivity
4. Verify the URL format is correct

