export interface MenuItem {
  menuItemId: string;
  name: string;
  description: string | null;
  priceCents: number;
  category: string;
  isAvailable: boolean;
  updatedAt: string;
}
