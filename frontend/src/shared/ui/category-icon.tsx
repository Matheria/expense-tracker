import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Heart,
  Plane,
  Gamepad2,
  BookOpen,
  Shirt,
  Dumbbell,
  Coffee,
  Music,
  Gift,
  Briefcase,
  Wrench,
  Smartphone,
  Baby,
  PawPrint,
  Landmark,
  Zap,
  type LucideProps,
} from 'lucide-react';

export type IconEntry = {
  name: string;
  component: React.FC<LucideProps>;
};

/** Curated lucide set offered in the category picker and rendered everywhere a category appears. */
export const CATEGORY_ICONS: IconEntry[] = [
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Utensils', component: Utensils },
  { name: 'Car', component: Car },
  { name: 'Home', component: Home },
  { name: 'Heart', component: Heart },
  { name: 'Plane', component: Plane },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Shirt', component: Shirt },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Coffee', component: Coffee },
  { name: 'Music', component: Music },
  { name: 'Gift', component: Gift },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Wrench', component: Wrench },
  { name: 'Smartphone', component: Smartphone },
  { name: 'Baby', component: Baby },
  { name: 'PawPrint', component: PawPrint },
  { name: 'Landmark', component: Landmark },
  { name: 'Zap', component: Zap },
];

const ICON_MAP: Record<string, React.FC<LucideProps>> = Object.fromEntries(
  CATEGORY_ICONS.map((i) => [i.name, i.component]),
);

/** Renders a category's lucide icon by its stored name; falls back to nothing for unknown names. */
export function CategoryIcon({ name, ...props }: { name?: string | null } & LucideProps) {
  const Icon = name ? ICON_MAP[name] : undefined;
  return Icon ? <Icon {...props} /> : null;
}
