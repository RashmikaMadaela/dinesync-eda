export type TicketStatus = "PENDING" | "COOKING" | "READY";

export interface TicketItem {
  menuItemId: string;
  name: string;
  quantity: number;
  status: TicketStatus;
}

export interface Ticket {
  ticketId: string;
  orderId: string;
  tableId: string;
  items: TicketItem[];
  status: TicketStatus;
  createdAt: string;
  readyAt: string | null;
}
