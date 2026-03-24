import type { Meta, StoryObj } from "@storybook/react";
import { PostCard } from "../../src/features/marketplace/components/PostCard";
import type { Post } from "../../src/types";

const samplePost: Post = {
  id: "1",
  name: "Sample Listing",
  price: 150,
  location: "Amman",
  seller: "Ahmad",
  sellerId: "u1",
  category: "Electronics",
  image: "https://placehold.co/400x300",
  description: "A sample product listing for demonstration.",
};

const meta = {
  title: "UI/PostCard",
  component: PostCard,
  args: {
    post: samplePost,
  },
} satisfies Meta<typeof PostCard>;

export default meta;

export const GridDefault = {
  args: {
    viewMode: "grid-4" as const,
  },
} satisfies StoryObj<typeof meta>;

export const ListView = {
  args: {
    viewMode: "list" as const,
  },
} satisfies StoryObj<typeof meta>;

export const Favorited = {
  args: {
    isFavorite: true,
    isAuthenticated: true,
  },
} satisfies StoryObj<typeof meta>;
