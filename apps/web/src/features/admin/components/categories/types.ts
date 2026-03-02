import { COLORS } from "../../../../constants/colors";

export interface CategoryFormData {
  name: string;
  nameAr: string;
  color: string;
  icon: string;
  image: string;
}

export function getDefaultCategoryFormData(): CategoryFormData {
  return {
    name: "",
    nameAr: "",
    color: COLORS.PRIMARY,
    icon: "box",
    image: "",
  };
}
