import React, { useState } from "react";
import * as api from "../actions/serverActions";
import { Group, Participant } from "../types";
import { Loader2 } from "lucide-react";
import AvatarUpload from "./AvatarUpload";

interface Props {
  onJoined: (group: Group, participant: Participant) => void;
  onBack: () => void;
}

export default function JoinGroup({ onJoined, onBack }: Props) {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nickname.trim()) return;

    setError("");
    setLoading(true);

    try {
      const { group, participant, error } = await api.joinGroup(
        code.toUpperCase(),
        nickname,
        avatar
      );
      if (group && participant) {
        onJoined(group, participant);
      } else {
        setError(error || "Group not found or invalid code.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Join a trip</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex justify-center mb-2">
          <AvatarUpload onImageChange={setAvatar} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Share Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. TOKYO24"
            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white shadow-sm text-lg uppercase font-mono tracking-widest"
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
            placeholder="e.g. Bob"
            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white shadow-sm text-lg"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !code || !nickname}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Join Trip"}
          </button>
        </div>
      </form>
    </div>
  );
}
