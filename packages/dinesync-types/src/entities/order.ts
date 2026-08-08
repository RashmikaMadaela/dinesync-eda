export type OrderStatus = "PLACED" | "COOKING" | "READY" | "SERVED";

export interface OrderLineItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  notes: string | null;
}

export interface Order {
  orderId: string;
  tableId: string;
  sessionId: string;
  placedByUserId: string;
  items: OrderLineItem[];
  status: OrderStatus;
  idempotencyKey: string;
  createdAt: string;
}
