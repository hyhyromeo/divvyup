import React, { useState, useEffect } from "react";
import { Group, Participant } from "./types";
import * as api from "./actions/serverActions";
import { supabase } from "./lib/supabase";
import Dashboard from "./components/Dashboard";
import CreateGroup from "./components/CreateGroup";
import JoinGroup from "./components/JoinGroup";
import { ArrowLeft, ArrowRight, History } from "lucide-react";

interface RecentTrip {
  groupId: string;
  userId: string;
  groupName: string;
  nickname: string;
  shareCode: string;
  timestamp: number;
}

export default function App() {
  // Simple state-based routing for the SPA
  const [currentView, setCurrentView] = useState<
    "home" | "create" | "join" | "dashboard"
  >("home");
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);

  // Check for stored session on load
  useEffect(() => {
    // --- Connection Test ---
    const testConnection = async () => {
      try {
        const { error } = await supabase.from("groups").select("id").limit(1);
        if (error) {
          console.error("Supabase Connection Error:", error.message);
          // Only show alert if it's a real connection error, not just an empty table
          if (error.code !== "PGRST116") {
            // PGRST116 is often returned for empty single results
            console.log(
              'Hint: Check if your table "groups" exists and RLS is configured.'
            );
          }
        } else {
          console.log("✅ Supabase connected successfully!");
        }
      } catch (err) {
        console.error("Unexpected Connection Error:", err);
      }
    };
    testConnection();
    // -----------------------

    const savedGroupId = localStorage.getItem("activeGroupId");
    const savedUserId = localStorage.getItem("activeUserId");

    if (savedGroupId && savedUserId) {
      api
        .getGroupDetails(savedGroupId)
        .then(({ group, participants }) => {
          const user = participants.find((p) => p.id === savedUserId);
          if (group && user) {
            setActiveGroup(group);
            setCurrentUser(user);
            setCurrentView("dashboard");
          } else {
            // Clear invalid session
            localStorage.removeItem("activeGroupId");
            localStorage.removeItem("activeUserId");
          }
        })
        .catch(() => {
          // If DB fetch fails (e.g. invalid ID), clear local storage
          localStorage.removeItem("activeGroupId");
          localStorage.removeItem("activeUserId");
        });
    }

    // Load history
    try {
      const history = localStorage.getItem("divvyup_history");
      if (history) {
        setRecentTrips(JSON.parse(history));
      }
    } catch (e) {
      console.error("Failed to parse history");
    }
  }, []);

  const handleGroupEntered = (group: Group, user: Participant) => {
    setActiveGroup(group);
    setCurrentUser(user);
    setCurrentView("dashboard");
    localStorage.setItem("activeGroupId", group.id);
    localStorage.setItem("activeUserId", user.id);

    // Update History
    const newTrip: RecentTrip = {
      groupId: group.id,
      userId: user.id,
      groupName: group.name,
      nickname: user.nickname,
      shareCode: group.share_code,
      timestamp: Date.now(),
    };

    setRecentTrips((prev) => {
      // Remove duplicates of the same group
      const filtered = prev.filter((t) => t.groupId !== group.id);
      // Add new trip to top, keep max 3
      const updated = [newTrip, ...filtered].slice(0, 3);
      localStorage.setItem("divvyup_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRejoin = (trip: RecentTrip) => {
    api
      .getGroupDetails(trip.groupId)
      .then(({ group, participants }) => {
        const user = participants.find((p) => p.id === trip.userId);
        if (group && user) {
          handleGroupEntered(group, user);
        } else {
          alert(
            "Unable to rejoin. The trip may have been deleted or you were removed."
          );
          // Optionally remove from history
          setRecentTrips((prev) => {
            const updated = prev.filter((t) => t.groupId !== trip.groupId);
            localStorage.setItem("divvyup_history", JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {
        alert("Error connecting to trip.");
      });
  };

  const handleLogout = () => {
    setActiveGroup(null);
    setCurrentUser(null);
    setCurrentView("home");
    localStorage.removeItem("activeGroupId");
    localStorage.removeItem("activeUserId");
  };

  const renderContent = () => {
    switch (currentView) {
      case "create":
        return (
          <CreateGroup
            onCreated={handleGroupEntered}
            onBack={() => setCurrentView("home")}
          />
        );
      case "join":
        return (
          <JoinGroup
            onJoined={handleGroupEntered}
            onBack={() => setCurrentView("home")}
          />
        );
      case "dashboard":
        return activeGroup && currentUser ? (
          <Dashboard
            group={activeGroup}
            currentUser={currentUser}
            onLeave={handleLogout}
          />
        ) : (
          <div>Loading...</div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
            <div className="bg-transparent p-6 rounded-full shadow-sm">
              <img
                src="/h.svg"
                alt="DivvyUp Logo"
                className="size-42 object-contain"
              />
            </div>
            {/* <h1 className="text-4xl font-extrabold text-slate-800 mb-4 text-center">
              DivvyUp
            </h1> */}
            <p className="text-slate-500 mb-12 text-center max-w-md text-lg">
              The easiest way to split bills on trips. No accounts, no hassle.
              Just create a group and start splitting.
            </p>

            <div className="flex flex-col w-full max-w-xs gap-4">
              <button
                onClick={() => setCurrentView("create")}
                className="w-full bg-primary hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all transform hover:scale-[1.02]"
              >
                Create a Trip
              </button>
              <button
                onClick={() => setCurrentView("join")}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl shadow-md border border-slate-200 transition-all transform hover:scale-[1.02]"
              >
                Join with Code
              </button>
            </div>

            {/* Recent Trips Section */}
            {recentTrips.length > 0 && (
              <div className="w-full max-w-xs mt-12 animate-fade-in">
                <div className="flex items-center gap-2 mb-4 pl-1">
                  <History size={16} className="text-slate-400" />
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                    Recent Trips
                  </h3>
                </div>
                <div className="space-y-3">
                  {recentTrips.map((trip) => (
                    <button
                      key={trip.groupId}
                      onClick={() => handleRejoin(trip)}
                      className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-slate-300 hover:shadow-md transition-all group text-left"
                    >
                      <div>
                        <div className="font-bold text-slate-700">
                          {trip.groupName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Continue as{" "}
                          <span className="font-medium text-slate-900">
                            {trip.nickname}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-slate-300 group-hover:text-primary transition-colors"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* <div className="mt-12 p-4 bg-slate-100 rounded-lg text-sm text-slate-500 text-center max-w-sm">
              <p className="font-semibold mb-1">Demo Mode</p>
              <p>
                Try joining with code:{" "}
                <span className="font-mono bg-white px-1 rounded">TOKYO24</span>
              </p>
            </div> */}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-900 font-sans selection:bg-slate-200">
      {currentView !== "home" && (
        <header className="fixed top-0 w-full z-10 bg-transparent backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-center px-4">
          {currentView !== "dashboard" && (
            <button
              onClick={() => setCurrentView("home")}
              className="absolute left-4 p-2 text-slate-400 hover:text-slate-700"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <img
              src="/h.svg"
              alt="Logo"
              className="mt-2 size-24 object-contain"
            />
          </div>
        </header>
      )}

      <main
        className={`${
          currentView === "home" ? "pt-0" : "pt-20"
        } pb-12 max-w-md mx-auto min-h-screen`}
      >
        {renderContent()}
      </main>
    </div>
  );
}
