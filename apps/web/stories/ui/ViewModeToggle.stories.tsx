import { ViewModeToggle } from "../../src/shared/ui/view-mode-toggle";

const meta = {
  title: "UI/ViewModeToggle",
  component: ViewModeToggle,
  args: {
    viewMode: "grid-4",
    language: "en",
    onChange: () => {},
  },
};

export default meta;

export const English = {};

export const Arabic = {
  args: {
    language: "ar",
  },
};

