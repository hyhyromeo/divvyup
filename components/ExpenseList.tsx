import React from 'react';
import { FullExpense, Participant } from '../types';
import { Receipt } from 'lucide-react';

interface Props {
  expenses: FullExpense[];
  participants: Participant[];
  onSelectExpense: (expense: FullExpense) => void;
}

export default function ExpenseList({ expenses, participants, onSelectExpense }: Props) {
  
  if (expenses.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Receipt className="w-12 h-12 mb-4 opacity-50" />
              <p>No expenses yet.</p>
          </div>
      );
  }

  const getNickname = (id: string) => participants.find(p => p.id === id)?.nickname || 'Unknown';

  return (
    <div className="space-y-3 pb-24">
      {expenses.map((expense) => {
        const date = new Date(expense.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const payer = getNickname(expense.paid_by_id);
        
        return (
            <button 
                key={expense.id} 
                onClick={() => onSelectExpense(expense)}
                className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50 hover:shadow-md transition-all text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2.5 rounded-lg text-slate-500">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800 text-sm truncate max-w-[150px] sm:max-w-[200px]">{expense.description}</h4>
                        <p className="text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{payer}</span> paid ${expense.amount.toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                     <span className="font-bold text-slate-800 text-lg">${expense.amount.toFixed(2)}</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-wide">{date}</span>
                </div>
            </button>
        );
      })}
    </div>
  );
}