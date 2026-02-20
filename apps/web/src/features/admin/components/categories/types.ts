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
    color: "#0A4ABF",
    icon: "box",
    image: "",
  };
}
