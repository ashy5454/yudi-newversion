"use client";

import React, { useEffect, useState } from 'react';
import { fetchYudiMetrics } from '@/services/statsService';
import { useAuth } from '@/components/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

const YudiStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);
        setIsAdmin(adminSnap.exists());
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const metrics = await fetchYudiMetrics();
        setStats(metrics);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAdmin]);

  if (authLoading || (user && !isAdmin)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">⚠️ Admin Access Required</h1>
          <p className="text-gray-400">
            {authLoading
              ? 'Loading...'
              : 'You must be an admin to view Yudi stats. Please ensure your account is added to the admins collection in Firestore.'}
          </p>
          {!authLoading && user && (
            <a
              href="/admin-view"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Go to Admin Dashboard
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="text-gray-400">Please sign in to view Yudi stats.</p>
          <a
            href="/"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Go to Main App
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">📊</div>
          <div className="text-cyan-400">Calculating Yudi Math...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">Error Loading Stats</h1>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>No stats available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-cyan-400">📊 YUDI COMMAND CENTER</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            detail="Total registered users since launch"
            icon="👥"
          />
          <StatCard
            title="Daily Messages (All Users)"
            value={stats.todayMessages}
            detail="Total messages sent by all users in last 24 hours"
            icon="💬"
          />
          <StatCard
            title="New Conversations Today"
            value={stats.todayConversations}
            detail="Number of new conversation threads started ONLY in the last 24 hours (daily count)"
            icon="🆕"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Conversations (Per User)"
            value={stats.avgConversationsPerUser}
            detail="Average number of conversations per user (unit: conversations/user)"
            icon="📈"
          />
          <StatCard
            title="Average Conversation Duration"
            value={`${stats.avgTimeSpentMinutes} min`}
            detail="Average length of a conversation session (time between first and last message), calculated across all conversations (all-time)"
            icon="⏱️"
          />
          <StatCard
            title="Total Messages (All-Time)"
            value={stats.totalMessages.toLocaleString()}
            detail="All-time message count across all conversations"
            icon="📨"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <StatCard
            title="Active Rooms (Total Conversations)"
            value={stats.activeRooms}
            detail="Total conversation threads/rooms EVER created (all-time cumulative count). Each room = one unique conversation between a user and a persona. This shows total engagement volume since launch."
            icon="💭"
          />
        </div>

        <div className="mt-12 p-6 bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="text-xl mb-4 text-yellow-400">💡 Metric Explanations</h2>
          <div className="space-y-3 text-zinc-400 text-sm leading-relaxed">
            <p>
              <span className="text-white font-semibold">Daily Messages (All Users):</span> Total number of messages sent by all users combined in the last 24 hours. This shows overall platform activity.
            </p>
            <p>
              <span className="text-white font-semibold">Total Conversations (Per User):</span> Average number of conversations each user has started. Unit: conversations per user. Higher = users are more engaged and starting multiple conversations.
            </p>
            <p>
              <span className="text-white font-semibold">Average Conversation Duration:</span> Average length of a conversation session (all-time, across all conversations). Calculated as the time between the first and last message in each conversation. This is NOT per day or per user - it's the average duration of any conversation session across your entire platform history.
            </p>
            <p>
              <span className="text-white font-semibold">Active Rooms (Total Conversations):</span> Total number of conversation threads/rooms EVER created (all-time cumulative count). Each room represents one conversation between a user and a persona. This is the total since launch.
            </p>
            <p>
              <span className="text-white font-semibold">New Conversations Today:</span> Number of NEW conversation threads started ONLY in the last 24 hours (daily count). This is different from Active Rooms, which counts ALL conversations ever created.
            </p>
            {stats.todayMessages < 10 ? (
              <p className="mt-4 pt-4 border-t border-zinc-800">
                <span className="text-yellow-400 font-semibold">⚠️ Low Daily Activity:</span> Only {stats.todayMessages} messages today. Consider adjusting your persona's empathy levels or engagement strategies.
              </p>
            ) : (
              <p className="mt-4 pt-4 border-t border-zinc-800">
                <span className="text-green-400 font-semibold">✅ Great Engagement:</span> {stats.todayMessages} messages today! Users are actively engaging with your personas.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/admin-view"
            className="inline-block px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm"
          >
            ← Back to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, detail, icon }: { title: string; value: string | number; detail: string; icon?: string }) => (
  <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-cyan-500 transition-all">
    {icon && <div className="text-3xl mb-2">{icon}</div>}
    <p className="text-zinc-500 text-sm uppercase tracking-wide">{title}</p>
    <p className="text-4xl font-bold my-2 text-cyan-400">{value}</p>
    <p className="text-xs text-zinc-600">{detail}</p>
  </div>
);

export default YudiStats;

