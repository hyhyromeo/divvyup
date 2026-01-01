import React, { useState } from "react";
import * as api from "../actions/serverActions";
import { Group, Participant } from "../types";
import { Loader2 } from "lucide-react";
import AvatarUpload from "./AvatarUpload";

interface Props {
  onCreated: (group: Group, participant: Participant) => void;
  onBack: () => void;
}

export default function CreateGroup({ onCreated, onBack }: Props) {
  const [tripName, setTripName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim() || !nickname.trim()) return;

    setLoading(true);
    try {
      const { group, participant } = await api.createGroup(
        tripName,
        nickname,
        avatar
      );
      if (group && participant) {
        onCreated(group, participant);
      } else {
        alert("Failed to create group. Please try again.");
      }
    } catch (err) {
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center">
        Start a new trip
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex justify-center mb-2">
          <AvatarUpload onImageChange={setAvatar} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Trip Name
          </label>
          <input
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="e.g. Barcelona 2024"
            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white shadow-sm text-lg"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Your Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Alice"
            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white shadow-sm text-lg"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !tripName || !nickname}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Create Trip"}
          </button>
        </div>
      </form>
    </div>
  );
}
