import React, { useState, useEffect } from 'react';
import { Group, Participant, FullExpense } from '../types';
import * as api from '../actions/serverActions';
import { supabase } from '../lib/supabase';
import AddExpenseModal from './AddExpenseModal';
import ExpenseDetailsModal from './ExpenseDetailsModal';
import ExpenseList from './ExpenseList';
import BalanceView from './BalanceView';
import PeopleList from './PeopleList';
import { Plus, Copy, LogOut, Check, Share2 } from 'lucide-react';

interface Props {
  group: Group;
  currentUser: Participant;
  onLeave: () => void;
}

export default function Dashboard({ group, currentUser, onLeave }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<FullExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<FullExpense | null>(null);
  const [editingExpense, setEditingExpense] = useState<FullExpense | null>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'people'>('expenses');
  const [copied, setCopied] = useState(false);

  // Subscribe to changes in real-time
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getGroupDetails(group.id);
        if (data.group) {
          setParticipants(data.participants);
          setExpenses(data.expenses);
        }
      } catch (err) {
        console.error("Failed to fetch group details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    // Listen for changes in the group
    const channel = supabase
      .channel(`group-${group.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `group_id=eq.${group.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${group.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_splits' }, // Filter by group_id is harder here, so we refresh on any split change
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.share_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `Join my trip "${group.name}" on DivvyUp! Group Code: ${group.share_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback for desktop: Copy full invite
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExpenseSubmit = async (desc: string, amount: number, paidBy: string, splitIds: string[]) => {
     if (editingExpense) {
        await api.updateExpense(editingExpense.id, paidBy, desc, amount, splitIds);
     } else {
        await api.addExpense(group.id, paidBy, desc, amount, splitIds);
     }
     setIsModalOpen(false);
     setEditingExpense(null);
     
     // Immediate fetch to update UI
     const data = await api.getGroupDetails(group.id);
     setParticipants(data.participants);
     setExpenses(data.expenses);
  };

  const handleEditRequest = () => {
      if (selectedExpense) {
          setEditingExpense(selectedExpense);
          setSelectedExpense(null);
          setIsModalOpen(true);
      }
  };

  const handleDeleteExpense = async (id: string) => {
      if (confirm("Are you sure you want to delete this expense?")) {
          await api.deleteExpense(id);
          setSelectedExpense(null);
          // UI will refresh via subscription
      }
  };

  const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingExpense(null);
  };

  const handlePeopleUpdate = async () => {
      const data = await api.getGroupDetails(group.id);
      setParticipants(data.participants);
  }

  // Find the latest version of current user from the fetched participants list to ensure permissions are up to date
  const latestCurrentUser = participants.find(p => p.id === currentUser.id) || currentUser;

  return (
    <div className="relative pb-20">
      {/* Group Header Info */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{group.name}</h2>
                    <p className="text-slate-500 text-sm">Welcome, {latestCurrentUser.nickname}</p>
                </div>
                <button onClick={onLeave} className="text-slate-400 hover:text-red-500">
                    <LogOut size={20} />
                </button>
            </div>
            
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Join Code</span>
                    <span className="text-lg font-mono font-bold text-slate-800 tracking-widest">{group.share_code}</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleShare}
                        className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-blue-600 active:scale-95 transition-all"
                        title="Share Invite"
                    >
                        <Share2 size={18} />
                    </button>
                    <button 
                        onClick={handleCopyCode}
                        className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-primary active:scale-95 transition-all"
                        title="Copy Code"
                    >
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mb-4 gap-2">
        {(['expenses', 'balances', 'people'] as const).map((tab) => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 font-semibold rounded-lg text-sm transition-colors capitalize ${activeTab === tab ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
                {tab}
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 min-h-[400px]">
        {activeTab === 'expenses' && (
            <ExpenseList 
                expenses={expenses} 
                participants={participants} 
                onSelectExpense={setSelectedExpense}
                loading={loading}
            />
        )}
        {activeTab === 'balances' && (
            <BalanceView 
                expenses={expenses} 
                participants={participants} 
                currentUser={latestCurrentUser} 
                loading={loading}
            />
        )}
        {activeTab === 'people' && (
            <PeopleList 
                participants={participants} 
                currentUser={latestCurrentUser} 
                onUpdate={handlePeopleUpdate}
                groupId={group.id}
                loading={loading}
            />
        )}
      </div>

      {/* Floating Action Button (Only on Expenses Tab) */}
      {activeTab === 'expenses' && (
        <div className="fixed bottom-6 right-6 z-20">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-full p-4 shadow-xl shadow-slate-200 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
                <Plus size={32} />
            </button>
        </div>
      )}

      {isModalOpen && (
        <AddExpenseModal 
            isOpen={isModalOpen}
            onClose={handleModalClose}
            participants={participants}
            currentUser={latestCurrentUser}
            onSubmit={handleExpenseSubmit}
            initialData={editingExpense || undefined}
        />
      )}

      {selectedExpense && (
        <ExpenseDetailsModal
            isOpen={!!selectedExpense}
            onClose={() => setSelectedExpense(null)}
            expense={selectedExpense}
            participants={participants}
            onEdit={handleEditRequest}
            onDelete={() => handleDeleteExpense(selectedExpense.id)}
        />
      )}
    </div>
  );
}