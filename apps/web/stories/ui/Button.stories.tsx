import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../src/shared/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

export const Default = {
  args: { children: "Button" },
} satisfies StoryObj<typeof meta>;

export const Destructive = {
  args: { children: "Delete", variant: "destructive" as const },
} satisfies StoryObj<typeof meta>;

export const Outline = {
  args: { children: "Outline", variant: "outline" as const },
} satisfies StoryObj<typeof meta>;

export const Ghost = {
  args: { children: "Ghost", variant: "ghost" as const },
} satisfies StoryObj<typeof meta>;

export const Small = {
  args: { children: "Small", size: "sm" as const },
} satisfies StoryObj<typeof meta>;

export const Large = {
  args: { children: "Large", size: "lg" as const },
} satisfies StoryObj<typeof meta>;
