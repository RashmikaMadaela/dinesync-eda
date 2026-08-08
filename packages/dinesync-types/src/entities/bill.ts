export type BillStatus = "OPEN" | "PAID";

export interface BillLineItem {
  orderId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Bill {
  billId: string;
  tableId: string;
  lineItems: BillLineItem[];
  totalCents: number;
  status: BillStatus;
  createdAt: string;
  paidAt: string | null;
}
