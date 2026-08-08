export type TableStatus = "CLOSED" | "OPEN" | "AWAITING_FOOD";

export interface Table {
  tableId: string;
  label: string;
  status: TableStatus;
  activeSessionId: string | null;
  updatedAt: string;
}
