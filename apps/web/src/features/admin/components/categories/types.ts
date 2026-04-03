export interface CategoryFormData {
  name: string;
  nameAr: string;
  image: string;
}

export function getDefaultCategoryFormData(): CategoryFormData {
  return {
    name: "",
    nameAr: "",
    image: "",
  };
}
