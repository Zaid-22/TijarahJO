import { SubpageHeader } from "../../src/shared/ui/subpage-header";

const meta = {
  title: "UI/SubpageHeader",
  component: SubpageHeader,
  args: {
    onBack: () => {},
    backLabel: "Back",
    title: "Settings",
    subtitle: "Manage account preferences",
    showLogo: false,
  },
};

export default meta;

export const Default = {};

export const Arabic = {
  args: {
    isRTL: true,
    backLabel: "العودة",
    title: "الإعدادات",
    subtitle: "إدارة تفضيلات الحساب",
  },
};

