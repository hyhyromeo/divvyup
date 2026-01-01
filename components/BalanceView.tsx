import React, { useMemo } from 'react';
import { FullExpense, Participant, Debt } from '../types';
import { ArrowRight, Loader2 } from 'lucide-react';

interface Props {
  expenses: FullExpense[];
  participants: Participant[];
  currentUser: Participant;
  loading?: boolean;
}

export default function BalanceView({ expenses, participants, currentUser, loading }: Props) {
  
  const debts = useMemo(() => {
    if (loading) return [];
    // 1. Calculate Net Balances
    const balances: Record<string, number> = {};
    participants.forEach(p => balances[p.id] = 0);

    expenses.forEach(expense => {
        const paidBy = expense.paid_by_id;
        const amount = expense.amount;
        
        // Payer gets + amount (they are owed this much by the group essentially)
        // But wait, it's easier to think: Payer paid X.
        // Splits: A, B, C each owe X/3.
        // So Payer's balance changes by + (X - X/3) if they are in split, or +X if not.
        // Actually simplest: 
        // Balance = Paid - FairShare
        
        if (balances[paidBy] !== undefined) {
             balances[paidBy] += amount;
        }

        expense.splits.forEach(split => {
            if (balances[split.participant_id] !== undefined) {
                balances[split.participant_id] -= split.share_amount;
            }
        });
    });

    // 2. Simplify Debts (Greedy Algorithm)
    const debtors: {id: string, amount: number}[] = [];
    const creditors: {id: string, amount: number}[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
        // Round to 2 decimals to avoid float issues
        const val = Math.round(amount * 100) / 100;
        if (val < -0.01) debtors.push({ id, amount: val }); // owes money
        if (val > 0.01) creditors.push({ id, amount: val }); // is owed money
    });

    debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const result: Debt[] = [];
    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        
        // The amount to settle is the minimum of what debtor owes and creditor is owed
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
        
        // Find nicknames
        const fromName = participants.find(p => p.id === debtor.id)?.nickname || 'Unknown';
        const toName = participants.find(p => p.id === creditor.id)?.nickname || 'Unknown';

        result.push({ from: fromName, to: toName, amount });

        // Update remaining amounts
        debtor.amount += amount;
        creditor.amount -= amount;

        // If settled (close to 0), move to next
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return result;
  }, [expenses, participants, loading]);

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-slate-300 animate-spin" />
              <p className="mt-4 text-slate-400 font-medium">Calculating balances...</p>
          </div>
      );
  }

  if (debts.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
              <p className="text-lg">All settled up!</p>
              <p className="text-sm">No one owes anything.</p>
          </div>
      );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl mb-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-2">How to settle up</h3>
          <p className="text-sm text-slate-600">These are the most efficient payments to clear all debts.</p>
      </div>

      {debts.map((debt, idx) => {
          const isUserPaying = debt.from === currentUser.nickname;
          const isUserReceiving = debt.to === currentUser.nickname;
          
          let cardClass = "bg-white border-slate-100";
          if (isUserPaying) cardClass = "bg-red-50 border-red-100";
          if (isUserReceiving) cardClass = "bg-slate-50 border-slate-200 shadow-sm";

          return (
            <div key={idx} className={`p-4 rounded-xl border shadow-sm flex items-center justify-between ${cardClass}`}>
                <div className="flex items-center gap-3 flex-1">
                    <div className="font-bold text-slate-700 text-sm truncate max-w-[80px]">{debt.from}</div>
                    <div className="text-slate-400 flex flex-col items-center px-2">
                        <span className="text-[10px] uppercase font-bold">Owes</span>
                        <ArrowRight size={16} />
                    </div>
                    <div className="font-bold text-slate-700 text-sm truncate max-w-[80px]">{debt.to}</div>
                </div>
                <div className="font-bold text-lg text-slate-800">
                    ${debt.amount.toFixed(2)}
                </div>
            </div>
          );
      })}
    </div>
  );
}