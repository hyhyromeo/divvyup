import { supabase } from '../lib/supabase';
import { Participant, Group, FullExpense } from '../types';

/**
 * Server Actions for DivvyUp
 * Note: Since this is a Vite project, these are regular async functions.
 */

/**
 * Creates a new trip group and the creator participant
 */
export async function createGroup(name: string, nickname: string, avatarUrl?: string): Promise<{ success: boolean; group?: Group; participant?: Participant; error?: string }> {
  try {
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name, share_code: shareCode })
      .select()
      .single();

    if (groupError || !group) {
      console.error('Group creation error:', groupError);
      return { success: false, error: 'Failed to create group' };
    }

    // 2. Create Creator Participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        group_id: group.id,
        nickname,
        avatar_url: avatarUrl,
        is_creator: true,
        is_admin: true
      })
      .select()
      .single();

    if (participantError || !participant) {
      console.error('Participant creation error:', participantError);
      return { success: false, error: 'Failed to create participant' };
    }

    return { success: true, group, participant };

  } catch (error) {
    console.error('Create group error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Handles a new participant joining a group via share code
 */
export async function joinGroup(shareCode: string, nickname: string, avatarUrl?: string): Promise<{ success: boolean; group?: Group; participant?: Participant; error?: string }> {
  try {
    // 1. Find the group by share code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('share_code', shareCode)
      .single();

    if (groupError || !group) {
      return { success: false, error: 'Group not found' };
    }

    // 2. Check if nickname already exists in this group
    const { data: existing } = await supabase
      .from('participants')
      .select('*')
      .eq('group_id', group.id)
      .eq('nickname', nickname)
      .maybeSingle();

    if (existing) {
      // If re-joining with same nickname, update avatar if provided
      if (avatarUrl && avatarUrl !== existing.avatar_url) {
        await supabase
          .from('participants')
          .update({ avatar_url: avatarUrl })
          .eq('id', existing.id);
        existing.avatar_url = avatarUrl;
      }
      return { success: true, group, participant: existing };
    }

    // 3. Create the new participant
    const { data: newParticipant, error: createError } = await supabase
      .from('participants')
      .insert({
        group_id: group.id,
        nickname,
        avatar_url: avatarUrl,
        is_creator: false,
        is_admin: false
      })
      .select()
      .single();

    if (createError || !newParticipant) {
      return { success: false, error: createError?.message || 'Failed to join group' };
    }

    return { success: true, group, participant: newParticipant };

  } catch (error) {
    console.error('Join group error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Fetches all details for a group including participants and expenses
 */
export async function getGroupDetails(groupId: string) {
  const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
  const { data: participants } = await supabase.from('participants').select('*').eq('group_id', groupId);
  
  // Fetch expenses with splits
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      *,
      splits:expense_splits(*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  return { 
    group, 
    participants: participants || [], 
    expenses: (expenses as FullExpense[]) || [] 
  };
}

/**
 * Adds a new participant manually (by admin)
 */
export async function addParticipant(groupId: string, nickname: string) {
  const { data, error } = await supabase
    .from('participants')
    .insert({
      group_id: groupId,
      nickname,
      is_creator: false,
      is_admin: false
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Removes a participant from the group
 */
export async function removeParticipant(participantId: string) {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', participantId);
  
  if (error) throw error;
}

/**
 * Toggles admin status for a participant
 */
export async function toggleAdmin(participantId: string) {
  // First get current status
  const { data: current } = await supabase
    .from('participants')
    .select('is_admin')
    .eq('id', participantId)
    .single();
  
  if (current) {
    const { error } = await supabase
      .from('participants')
      .update({ is_admin: !current.is_admin })
      .eq('id', participantId);
    
    if (error) throw error;
  }
}

/**
 * Adds a new expense to the group and creates splits
 */
export async function addExpense(groupId: string, paidById: string, description: string, amount: number, splitAmongIds: string[]) {
  // 1. Create Expense
  const { data: expense, error: expError } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      paid_by_id: paidById,
      description,
      amount
    })
    .select()
    .single();
  
  if (expError || !expense) throw expError || new Error("Failed to create expense");

  // 2. Create Splits (Equal splitting logic)
  const splitAmount = amount / splitAmongIds.length;
  const splitsData = splitAmongIds.map(pid => ({
    expense_id: expense.id,
    participant_id: pid,
    share_amount: splitAmount
  }));

  const { error: splitsError } = await supabase.from('expense_splits').insert(splitsData);
  if (splitsError) throw splitsError;

  return expense;
}

/**
 * Updates an existing expense and its splits
 */
export async function updateExpense(expenseId: string, paidById: string, description: string, amount: number, splitAmongIds: string[]) {
  // 1. Update Expense details
  const { error: expError } = await supabase
    .from('expenses')
    .update({
      paid_by_id: paidById,
      description,
      amount
    })
    .eq('id', expenseId);

  if (expError) throw expError;

  // 2. Delete old splits
  await supabase.from('expense_splits').delete().eq('expense_id', expenseId);

  // 3. Create new splits
  const splitAmount = amount / splitAmongIds.length;
  const splitsData = splitAmongIds.map(pid => ({
    expense_id: expenseId,
    participant_id: pid,
    share_amount: splitAmount
  }));

  const { error: splitsError } = await supabase.from('expense_splits').insert(splitsData);
  if (splitsError) throw splitsError;
}

/**
 * Deletes an expense and its splits (cascaded by DB)
 */
export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);
  
  if (error) throw error;
}
