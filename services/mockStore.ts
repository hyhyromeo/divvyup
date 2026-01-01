import { Group, Participant, FullExpense, ExpenseSplit } from '../types';

/**
 * This service mimics the Supabase backend behavior using LocalStorage
 * so the app is functional in the preview environment.
 */

const STORAGE_KEY = 'divvyup_data_v1';

interface StoreData {
  groups: Group[];
  participants: Participant[];
  expenses: FullExpense[];
}

const getStore = (): StoreData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);
  return { groups: [], participants: [], expenses: [] };
};

const setStore = (data: StoreData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Seed initial data if empty
if (!localStorage.getItem(STORAGE_KEY)) {
  const groupId = 'demo-group-1';
  const u1 = 'user-1';
  const u2 = 'user-2';
  const u3 = 'user-3';
  
  setStore({
    groups: [
      { id: groupId, name: 'Tokyo Trip 2024', share_code: 'TOKYO24', created_at: new Date().toISOString() }
    ],
    participants: [
      { id: u1, group_id: groupId, nickname: 'Alice', is_creator: true, is_admin: true },
      { id: u2, group_id: groupId, nickname: 'Bob', is_creator: false, is_admin: false },
      { id: u3, group_id: groupId, nickname: 'Charlie', is_creator: false, is_admin: false },
    ],
    expenses: [
      {
        id: 'exp-1',
        group_id: groupId,
        paid_by_id: u1,
        description: 'Sushi Dinner',
        amount: 120,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        splits: [
          { id: 's-1', expense_id: 'exp-1', participant_id: u1, share_amount: 40 },
          { id: 's-2', expense_id: 'exp-1', participant_id: u2, share_amount: 40 },
          { id: 's-3', expense_id: 'exp-1', participant_id: u3, share_amount: 40 },
        ]
      },
      {
        id: 'exp-2',
        group_id: groupId,
        paid_by_id: u2,
        description: 'Taxi to Hotel',
        amount: 30,
        created_at: new Date().toISOString(),
        splits: [
          { id: 's-4', expense_id: 'exp-2', participant_id: u1, share_amount: 15 },
          { id: 's-5', expense_id: 'exp-2', participant_id: u2, share_amount: 15 },
        ]
      }
    ]
  });
}

export const mockService = {
  createGroup: async (name: string, creatorNickname: string, avatarUrl?: string) => {
    const store = getStore();
    const groupId = crypto.randomUUID();
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newGroup: Group = {
      id: groupId,
      name,
      share_code: shareCode,
      created_at: new Date().toISOString(),
    };

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      group_id: groupId,
      nickname: creatorNickname,
      avatar_url: avatarUrl,
      is_creator: true,
      is_admin: true, // Creators are admins
    };

    store.groups.push(newGroup);
    store.participants.push(newParticipant);
    setStore(store);

    return { group: newGroup, participant: newParticipant };
  },

  joinGroup: async (shareCode: string, nickname: string, avatarUrl?: string) => {
    const store = getStore();
    const group = store.groups.find(g => g.share_code === shareCode);
    
    if (!group) throw new Error('Group not found');

    const existing = store.participants.find(p => p.group_id === group.id && p.nickname === nickname);
    if (existing) {
        // Optional: Update avatar if rejoining? 
        // For simplicity, we keep original, unless we added an update method.
        return { group, participant: existing };
    }

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      group_id: group.id,
      nickname,
      avatar_url: avatarUrl,
      is_creator: false,
      is_admin: false,
    };

    store.participants.push(newParticipant);
    setStore(store);

    return { group, participant: newParticipant };
  },

  // Manual add by admin
  addParticipant: async (groupId: string, nickname: string) => {
    const store = getStore();
    
    // Check dupe
    const existing = store.participants.find(p => p.group_id === groupId && p.nickname === nickname);
    if (existing) throw new Error("Nickname exists");

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      group_id: groupId,
      nickname,
      is_creator: false,
      is_admin: false,
    };

    store.participants.push(newParticipant);
    setStore(store);
    return newParticipant;
  },

  removeParticipant: async (participantId: string) => {
    const store = getStore();
    // In a real app, we'd check if they are part of expenses. 
    // For mock, we just remove them to satisfy the prompt requirements.
    store.participants = store.participants.filter(p => p.id !== participantId);
    setStore(store);
  },

  toggleAdmin: async (participantId: string) => {
    const store = getStore();
    const p = store.participants.find(p => p.id === participantId);
    if (p) {
        p.is_admin = !p.is_admin;
        setStore(store);
    }
  },

  getGroupDetails: async (groupId: string) => {
    const store = getStore();
    const group = store.groups.find(g => g.id === groupId);
    const participants = store.participants.filter(p => p.group_id === groupId);
    const expenses = store.expenses.filter(e => e.group_id === groupId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return { group, participants, expenses };
  },

  addExpense: async (groupId: string, paidById: string, description: string, amount: number, splitAmongIds: string[]) => {
    const store = getStore();
    const expenseId = crypto.randomUUID();
    
    const splitAmount = amount / splitAmongIds.length;
    
    const splits: ExpenseSplit[] = splitAmongIds.map(pid => ({
      id: crypto.randomUUID(),
      expense_id: expenseId,
      participant_id: pid,
      share_amount: splitAmount
    }));

    const newExpense: FullExpense = {
      id: expenseId,
      group_id: groupId,
      paid_by_id: paidById,
      description,
      amount,
      created_at: new Date().toISOString(),
      splits
    };

    store.expenses.push(newExpense);
    setStore(store);
    return newExpense;
  },

  updateExpense: async (expenseId: string, paidById: string, description: string, amount: number, splitAmongIds: string[]) => {
    const store = getStore();
    const expenseIndex = store.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) throw new Error("Expense not found");

    const expense = store.expenses[expenseIndex];
    
    // Update basic fields
    expense.paid_by_id = paidById;
    expense.description = description;
    expense.amount = amount;
    
    // Recalculate splits
    const splitAmount = amount / splitAmongIds.length;
    const newSplits: ExpenseSplit[] = splitAmongIds.map(pid => ({
      id: crypto.randomUUID(), // In mock, simple regeneration is fine
      expense_id: expenseId,
      participant_id: pid,
      share_amount: splitAmount
    }));
    
    expense.splits = newSplits;
    
    store.expenses[expenseIndex] = expense;
    setStore(store);
    return expense;
  }
};