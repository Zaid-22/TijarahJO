import { Button } from "../../src/shared/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Primary Action",
    variant: "default",
  },
};

export default meta;

export const Primary = {};

export const Outline = {
  args: {
    variant: "outline",
    children: "Secondary Action",
  },
};

