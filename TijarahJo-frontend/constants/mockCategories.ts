// Mock Categories Data with Unique IDs
import { Category } from "../types";

export const mockCategories: Category[] = [
  {
    id: "cat_1734600000000_electronics",
    name: "Electronics",
    slug: "electronics",
    icon: "Laptop",
    color: "#0A4ABF",
    image: "https://images.unsplash.com/photo-1648140898579-9eb4ad03c052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwY2FtZXJhJTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzY2MjM0OTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Phones, laptops, cameras, and more electronic devices",
  },
  {
    id: "cat_1734600001000_mobilephonestablets",
    name: "Mobile Phones & Tablets",
    slug: "mobile-phones-tablets",
    icon: "Smartphone",
    color: "#3B82F6",
    image: "https://images.unsplash.com/photo-1602980760473-5160c97b0cdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRlc3QlMjBzbWFydHBob25lJTIwdGFibGV0JTIwZmxhdGxheXxlbnwxfHx8fDE3NjYyMzY1MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Smartphones and tablets",
  },
  {
    id: "cat_1734600002000_computerslaptops",
    name: "Computers & Laptops",
    slug: "computers-laptops",
    icon: "Monitor",
    color: "#6366F1",
    image: "https://images.unsplash.com/photo-1600065428205-b3fb0bd02b3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBtb25pdG9yJTIwZGVzayUyMHNldHVwfGVufDF8fHx8MTc2NjIzNTQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Laptops and desktop computers",
  },
  {
    id: "cat_1734600003000_homeappliances",
    name: "Home Appliances",
    slug: "home-appliances",
    icon: "Refrigerator",
    color: "#10B981",
    image: "https://images.unsplash.com/photo-1723902499640-c27272c37734?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwc3RvdmUlMjBvdmVufGVufDF8fHx8MTc2NjIzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Kitchen and home appliances",
  },
  {
    id: "cat_1734600004000_furniture",
    name: "Furniture",
    slug: "furniture",
    icon: "Armchair",
    color: "#8B5CF6",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjYxMjg2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Tables, chairs, sofas, and home furniture",
  },
  {
    id: "cat_1734600005000_vehicles",
    name: "Vehicles",
    slug: "vehicles",
    icon: "Car",
    color: "#EF4444",
    image: "https://images.unsplash.com/photo-1615966996783-5d361a011237?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBmcm9udCUyMHZpZXd8ZW58MXx8fHwxNzY2MjM0MDYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Cars, motorcycles, and other vehicles",
  },
  {
    id: "cat_1734600006000_fashionclothing",
    name: "Fashion & Clothing",
    slug: "fashion-clothing",
    icon: "ShoppingBag",
    color: "#FF69B4",
    image: "https://images.unsplash.com/photo-1604506847073-4a8e18e07d92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG90aGluZyUyMHJhY2slMjBmYXNoaW9ufGVufDF8fHx8MTc2NjE2NjIxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Clothing, shoes, and fashion items",
  },
  {
    id: "cat_1734600007000_sportsfitness",
    name: "Sports & Fitness",
    slug: "sports-fitness",
    icon: "Dumbbell",
    color: "#10B981",
    image: "https://images.unsplash.com/photo-1683758507025-6e74ad3ca1e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZXF1aXBtZW50JTIwZHVtYmJlbGxzJTIwd2VpZ2h0cyUyMG1hdHxlbnwxfHx8fDE3NjYyMzkyNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Sports equipment and fitness gear",
  },
  {
    id: "cat_1734600008000_toysgames",
    name: "Toys & Games",
    slug: "toys-games",
    icon: "Gamepad2",
    color: "#EC4899",
    image: "https://images.unsplash.com/photo-1566595151374-4e57e0fd2dfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3klMjBibG9ja3MlMjBib2FyZCUyMGdhbWVzJTIwdGVkZHklMjBiZWFyJTIwZmxhdGxheXxlbnwxfHx8fDE3NjYyMzkwODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Toys, games, and entertainment",
  },
  {
    id: "cat_1734600009000_realestate",
    name: "Real Estate",
    slug: "real-estate",
    icon: "Home",
    color: "#0EA5E9",
    image: "https://images.unsplash.com/photo-1758448756207-54505680d130?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMHdpbmRvd3MlMjBncmVlbmVyeSUyMGV4dGVyaW9yfGVufDF8fHx8MTc2NjIzNTc5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Properties for sale or rent",
  },
  {
    id: "cat_1734600010000_petsanimals",
    name: "Pets & Animals",
    slug: "pets-animals",
    icon: "PawPrint",
    color: "#84CC16",
    image: "https://images.unsplash.com/photo-1573435567032-ff5982925350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjYXQlMjBwZXR8ZW58MXx8fHwxNzY2MjM0MDY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Pets and animal supplies",
  },
  {
    id: "cat_1734600011000_services",
    name: "Services",
    slug: "services",
    icon: "Wrench",
    color: "#64748B",
    image: "https://images.unsplash.com/photo-1760009436767-d154e930e55c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBoZWxtZXQlMjB0b29scyUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjYyMzU0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Professional services",
  },
  {
    id: "cat_1734600012000_other",
    name: "Other",
    slug: "other",
    icon: "Package",
    color: "#9333EA",
    image: "https://images.unsplash.com/photo-1765000884289-baee6a441acd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXNjZWxsYW5lb3VzJTIwcHJvZHVjdHMlMjBjb2xsZWN0aW9ufGVufDF8fHx8MTc2NjIzNzg0OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Miscellaneous items",
  },
];

// Helper function to get category by ID
export function getCategoryById(id: string): Category | undefined {
  return mockCategories.find(category => category.id === id);
}

// Helper function to get category by name
export function getCategoryByName(name: string): Category | undefined {
  return mockCategories.find(
    category => category.name.toLowerCase() === name.toLowerCase()
  );
}

// Helper function to get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find(category => category.slug === slug);
}

// Helper function to get category ID by name (for backward compatibility)
export function getCategoryIdByName(name: string): string | undefined {
  const category = getCategoryByName(name);
  return category?.id;
}