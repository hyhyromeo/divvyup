import React, { useState } from 'react';
import { Participant } from '../types';
import * as api from '../actions/serverActions';
import { Trash2, Shield, ShieldCheck, UserPlus, Crown, Loader2 } from 'lucide-react';

interface Props {
  participants: Participant[];
  currentUser: Participant;
  groupId: string;
  onUpdate: () => void;
  loading?: boolean;
}

export default function PeopleList({ participants, currentUser, groupId, onUpdate, loading }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;
    
    try {
        await api.addParticipant(groupId, newNickname);
        setNewNickname('');
        setIsAdding(false);
        onUpdate();
    } catch (err) {
        alert("Failed to add user (might already exist)");
    }
  };

  const handleRemove = async (id: string) => {
      if (confirm("Are you sure? This might affect expense history.")) {
          await api.removeParticipant(id);
          onUpdate();
      }
  };

  const handleToggleAdmin = async (id: string) => {
      await api.toggleAdmin(id);
      onUpdate();
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-slate-300 animate-spin" />
              <p className="mt-4 text-slate-400 font-medium">Loading members...</p>
          </div>
      );
  }

  return (
    <div className="pb-24 animate-fade-in">
        {/* Only show trip member count/add button to admins */}
        {currentUser.is_admin && (
            <div className="bg-white border border-slate-100 rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="font-bold text-slate-800">Trip Members</h3>
                    <p className="text-xs text-slate-500">{participants.length} people in this trip</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                >
                    <UserPlus size={20} />
                </button>
            </div>
        )}

        {isAdding && (
            <form onSubmit={handleAddUser} className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-slide-up">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Add New Person</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newNickname} 
                        onChange={e => setNewNickname(e.target.value)}
                        placeholder="Nickname"
                        className="flex-1 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                        autoFocus
                    />
                    <button type="submit" className="bg-slate-800 text-white px-4 rounded-lg font-bold">Add</button>
                </div>
            </form>
        )}

        <div className="space-y-3">
            {participants.map(p => {
                const isMe = p.id === currentUser.id;
                // Owner can remove anyone (except self). Admin can remove non-creators.
                const canRemove = currentUser.is_admin && !p.is_creator && !isMe;
                // Only creator can toggle admin status (and not for themselves)
                const canToggleAdmin = currentUser.is_creator && !isMe;

                return (
                    <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden border-2 ${isMe ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-600 border-white shadow-sm'}`}>
                                {p.avatar_url ? (
                                    <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                                ) : (
                                    p.nickname.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-800">{p.nickname}</span>
                                    {p.is_creator && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
                                    {p.is_admin && !p.is_creator && <ShieldCheck size={14} className="text-blue-500" />}
                                    {isMe && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">You</span>}
                                </div>
                                <p className="text-xs text-slate-400">
                                    {p.is_creator ? 'Owner' : p.is_admin ? 'Admin' : 'Member'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {canToggleAdmin && (
                                <button 
                                    onClick={() => handleToggleAdmin(p.id)}
                                    className={`p-2 rounded-lg transition-colors ${p.is_admin ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-blue-400'}`}
                                    title={p.is_admin ? "Revoke Admin" : "Make Admin"}
                                >
                                    <Shield size={18} />
                                </button>
                            )}
                            
                            {canRemove && (
                                <button 
                                    onClick={() => handleRemove(p.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
}