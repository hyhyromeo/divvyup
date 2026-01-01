import React from "react";
import { FullExpense, Participant } from "../types";
import {
  X,
  Receipt,
  Calendar,
  Clock,
  User,
  Pencil,
  Trash2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense: FullExpense;
  participants: Participant[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function ExpenseDetailsModal({
  isOpen,
  onClose,
  expense,
  participants,
  onEdit,
  onDelete,
}: Props) {
  if (!isOpen) return null;

  const getParticipant = (id: string) => participants.find((p) => p.id === id);
  const payer = getParticipant(expense.paid_by_id);
  const payerName = payer?.nickname || "Unknown";

  const dateObj = new Date(expense.created_at);
  const dateStr = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Receipt size={24} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"
              title="Edit Expense"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete Expense"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Title & Amount */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-1">
            {expense.description}
          </h3>
          <div className="text-4xl font-extrabold text-slate-900">
            ${expense.amount.toFixed(2)}
          </div>
        </div>

        {/* Meta Data */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-slate-600">
            <User size={18} className="text-slate-400" />
            <span>
              Paid by{" "}
              <span className="font-bold text-slate-800">{payerName}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <Calendar size={18} className="text-slate-400" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <Clock size={18} className="text-slate-400" />
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Splits */}
        <div>
          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Split with
          </h4>
          <div className="space-y-3">
            {expense.splits.map((split) => {
              const person = getParticipant(split.participant_id);
              return (
                <div
                  key={split.id}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                      {person?.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        person?.nickname.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                    <span className="text-slate-700 font-medium">
                      {person?.nickname || "Unknown"}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    ${split.share_amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
