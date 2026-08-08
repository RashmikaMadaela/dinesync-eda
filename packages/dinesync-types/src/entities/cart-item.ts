export interface CartItem {
  cartItemId: string;
  sessionId: string;
  menuItemId: string;
  addedByUserId: string;
  quantity: number;
  notes: string | null;
  unitPriceCents: number;
  createdAt: string;
}
