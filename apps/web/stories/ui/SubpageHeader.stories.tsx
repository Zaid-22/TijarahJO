import type { Meta, StoryObj } from "@storybook/react";
import { SubpageHeader } from "../../src/shared/ui/subpage-header";

const meta = {
  title: "UI/SubpageHeader",
  component: SubpageHeader,
  args: {
    onBack: () => {},
  },
} satisfies Meta<typeof SubpageHeader>;

export default meta;

export const Default = {
  args: {
    title: "Page Title",
  },
} satisfies StoryObj<typeof meta>;

export const WithSubtitle = {
  args: {
    title: "Settings",
    subtitle: "Manage your account preferences",
  },
} satisfies StoryObj<typeof meta>;

export const RTL = {
  args: {
    title: "الإعدادات",
    subtitle: "إدارة التفضيلات",
    isRTL: true,
    backLabel: "العودة",
  },
} satisfies StoryObj<typeof meta>;

export const WithBackLabel = {
  args: {
    title: "Details",
    backLabel: "Back to list",
  },
} satisfies StoryObj<typeof meta>;
