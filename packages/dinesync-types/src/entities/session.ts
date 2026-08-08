export type SessionMemberStatus = "LEADER" | "MEMBER" | "PENDING";

export interface SessionMember {
  userId: string;
  status: SessionMemberStatus;
  joinedAt: string;
  lastHeartbeatAt: string | null;
}

export type CartLockState = "OPEN" | "LOCKED";

export interface Session {
  sessionId: string;
  tableId: string;
  leaderId: string;
  members: SessionMember[];
  cartLockState: CartLockState;
  createdAt: string;
}
