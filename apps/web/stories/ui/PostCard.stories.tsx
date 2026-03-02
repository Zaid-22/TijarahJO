import type { Post } from "../../src/types";
import { PostCard } from "../../src/features/marketplace/components/PostCard";

const samplePost: Post = {
  id: "post-story-1",
  name: "iPhone 13 Pro",
  price: 450,
  location: "Amman",
  area: "Abdoun",
  seller: "Demo Seller",
  sellerId: "seller-story-1",
  category: "Electronics",
  image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80&auto=format&fit=crop",
  status: "ACTIVE",
};

const meta = {
  title: "Marketplace/PostCard",
  component: PostCard,
  args: {
    post: samplePost,
    isAuthenticated: true,
    isFavorite: false,
    language: "en",
    onPostClick: () => {},
    onFavoriteToggle: () => {},
  },
};

export default meta;

export const Grid = {};

export const List = {
  args: {
    viewMode: "list",
  },
};

