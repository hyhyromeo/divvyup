// types/index.ts

/**
 * Represents a trip group or room
 */
export interface Group {
  id: string; // UUID
  share_code: string;
  name: string;
  created_at?: string;
}

/**
 * Represents a person in a trip group
 */
export interface Participant {
  id: string; // UUID
  group_id: string;
  nickname: string;
  is_creator: boolean;
  is_admin: boolean;
  avatar_url?: string; // Base64 string for the avatar
  created_at?: string;
}

/**
 * Represents a shared expense
 */
export interface Expense {
  id: string; // UUID
  group_id: string;
  paid_by_id: string;
  description: string;
  amount: number;
  created_at?: string;
  // UI helpers
  paid_by_nickname?: string;
}

/**
 * Represents the split of an expense for a specific participant
 */
export interface ExpenseSplit {
  id: string; // UUID
  expense_id: string;
  participant_id: string;
  share_amount: number;
}

/**
 * Helper type for full expense details including its splits
 */
export interface FullExpense extends Expense {
  splits: ExpenseSplit[];
}

/**
 * Helper type for displaying balances
 */
export interface ParticipantBalance {
  participant_id: string;
  nickname: string;
  total_paid_out: number;
  total_debt: number;
  net_balance: number;
}

