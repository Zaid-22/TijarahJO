import { 
  Camera,
  Smartphone,
  Monitor,
  Refrigerator,
  Armchair, 
  Car,
  ShoppingBag,
  Sparkles,
  Dumbbell,
  BookOpen,
  Gamepad2,
  Home,
  PawPrint,
  Wrench,
  Package,
  type LucideIcon
} from "lucide-react";

export interface CategoryData {
  name: string;
  nameAr: string;
  icon: LucideIcon;
  color: string;
  image: string;
}

export const categoryData: CategoryData[] = [
  {
    name: "Electronics",
    nameAr: "الإلكترونيات",
    icon: Camera,
    color: "#0A4ABF",
    image: "https://images.unsplash.com/photo-1761641466573-f240b6e446de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGRldmljZXN8ZW58MXx8fHwxNzY2MzEzNjM2fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    name: "Mobile Phones & Tablets",
    nameAr: "هواتف ذكية وتابلتات",
    icon: Smartphone,
    color: "#3B82F6",
    image: "https://images.unsplash.com/photo-1602980760473-5160c97b0cdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRlc3QlMjBzbWFydHBob25lJTIwdGFibGV0JTIwZmxhdGxheXxlbnwxfHx8fDE3NjYyMzY1MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Computers & Laptops",
    nameAr: "حواسيب وأجهزة كمبيوتر محمولة",
    icon: Monitor,
    color: "#6366F1",
    image: "https://images.unsplash.com/photo-1511385348-a52b4a160dc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlcnxlbnwxfHx8fDE3NjYxOTM4NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    name: "Home Appliances",
    nameAr: "أجهزة منزلية",
    icon: Refrigerator,
    color: "#10B981",
    image: "https://images.unsplash.com/photo-1740803292374-1b167c1558b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwYXBwbGlhbmNlcyUyMGtpdGNoZW58ZW58MXx8fHwxNzY2MjMyMTUwfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    name: "Furniture",
    nameAr: "الأثاث",
    icon: Armchair,
    color: "#8B5CF6",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjYxMjg2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Vehicles",
    nameAr: "المركبات",
    icon: Car,
    color: "#EF4444",
    image: "https://images.unsplash.com/photo-1615966996783-5d361a011237?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBmcm9udCUyMHZpZXd8ZW58MXx8fHwxNzY2MjM0MDYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Fashion & Clothing",
    nameAr: "الموضة والأزياء",
    icon: ShoppingBag,
    color: "#FF69B4",
    image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MXx8fHwxNzY2MjM5OTM5fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    name: "Health & Beauty",
    nameAr: "الصحة والجمال",
    icon: Sparkles,
    color: "#EC4899",
    image: "https://images.unsplash.com/photo-1600180583258-6d9b0c7b782b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2luY2FyZSUyMGNvc21ldGljcyUyMG1hcmJsZSUyMGZsYXRsYXl8ZW58MXx8fHwxNzY2MjM1NDg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Sports & Fitness",
    nameAr: "الرياضة واللياقة البدنية",
    icon: Dumbbell,
    color: "#10B981",
    image: "https://images.unsplash.com/photo-1683758507025-6e74ad3ca1e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZXF1aXBtZW50JTIwZHVtYmJlbGxzJTIwd2VpZ2h0cyUyMG1hdHxlbnwxfHx8fDE3NjYyMzkyNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Books & Stationery",
    nameAr: "كتب وأدوات مكتبية",
    icon: BookOpen,
    color: "#14B8A6",
    image: "https://images.unsplash.com/photo-1721552023489-6c2ec21d297f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFjayUyMGJvb2tzJTIwbGlicmFyeXxlbnwxfHx8fDE3NjYyMzQwNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Toys & Games",
    nameAr: "ألعاب وألعاب فيديو",
    icon: Gamepad2,
    color: "#EC4899",
    image: "https://images.unsplash.com/photo-1566595151374-4e57e0fd2dfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3klMjBibG9ja3MlMjBib2FyZCUyMGdhbWVzJTIwdGVkZHklMjBiZWFyJTIwZmxhdGxheXxlbnwxfHx8fDE3NjYyMzkwODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Real Estate",
    nameAr: "عقارات",
    icon: Home,
    color: "#0EA5E9",
    image: "https://images.unsplash.com/photo-1758448756207-54505680d130?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMHdpbmRvd3MlMjBncmVlbmVyeSUyMGV4dGVyaW9yfGVufDF8fHx8MTc2NjIzNTc5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Pets & Animals",
    nameAr: "حيوانات أليفة",
    icon: PawPrint,
    color: "#84CC16",
    image: "https://images.unsplash.com/photo-1573435567032-ff5982925350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjYXQlMjBwZXR8ZW58MXx8fHwxNzY2MjM0MDY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Services",
    nameAr: "خدمات",
    icon: Wrench,
    color: "#64748B",
    image: "https://images.unsplash.com/photo-1760009436767-d154e930e55c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBoZWxtZXQlMjB0b29scyUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjYyMzU0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    name: "Other",
    nameAr: "أخرى",
    icon: Package,
    color: "#9333EA",
    image: "https://images.unsplash.com/photo-1765000884289-baee6a441acd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXNjZWxsYW5lb3VzJTIwcHJvZHVjdHMlMjBjb2xsZWN0aW9ufGVufDF8fHx8MTc2NjIzNzg0OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  }
];