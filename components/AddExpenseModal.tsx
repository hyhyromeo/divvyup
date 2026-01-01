import React, { useState } from 'react';
import { Participant, FullExpense } from '../types';
import { X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUser: Participant;
  onSubmit: (desc: string, amount: number, paidBy: string, splitIds: string[]) => void;
  initialData?: FullExpense;
}

export default function AddExpenseModal({ isOpen, onClose, participants, currentUser, onSubmit, initialData }: Props) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [paidBy, setPaidBy] = useState(initialData?.paid_by_id || currentUser.id);
  const [splitAmong, setSplitAmong] = useState<string[]>(
    initialData ? initialData.splits.map(s => s.participant_id) : participants.map(p => p.id)
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!description || isNaN(val) || val <= 0 || splitAmong.length === 0) return;
    onSubmit(description, val, paidBy, splitAmong);
  };

  const toggleSplit = (id: string) => {
      setSplitAmong(prev => 
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Expense' : 'Add Expense'}</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Amount */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
                <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                            setAmount(val);
                        }
                    }}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50"
                    autoFocus={!isEditing}
                />
            </div>

            {/* Description */}
            <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was it for?"
                className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />

            {/* Paid By */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-500">Paid by</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {participants.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setPaidBy(p.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${paidBy === p.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            {p.id === currentUser.id ? 'You' : p.nickname}
                        </button>
                    ))}
                </div>
            </div>

            {/* Split Among */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                    <label className="text-sm font-semibold text-slate-500">Split among</label>
                    <button 
                        type="button" 
                        onClick={() => setSplitAmong(participants.map(p => p.id))}
                        className="text-xs text-slate-800 font-bold"
                    >
                        Select All
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {participants.map(p => {
                        const isSelected = splitAmong.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => toggleSplit(p.id)}
                                className={`flex items-center justify-between px-3 py-3 rounded-xl border transition-all ${isSelected ? 'bg-slate-50 border-slate-800 text-slate-800' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                <span className="font-medium truncate">{p.nickname}</span>
                                {isSelected && <Check size={16} className="text-slate-800" />}
                            </button>
                        )
                    })}
                </div>
                {splitAmong.length === 0 && <p className="text-xs text-red-500">Must select at least one person.</p>}
            </div>

            <button 
                type="submit" 
                disabled={!description || !amount || splitAmong.length === 0}
                className="mt-2 w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all"
            >
                {isEditing ? 'Update Expense' : 'Save Expense'}
            </button>
        </form>
      </div>
    </div>
  );
}