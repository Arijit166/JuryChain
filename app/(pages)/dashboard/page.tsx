'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { User, Trophy, Briefcase, Edit2, Copy, Award, Calendar } from 'lucide-react';
import Link from 'next/link';

interface UserCompetition {
  id: string;
  title: string;
  role: 'sponsor' | 'participant' | 'judge';
  status: 'active' | 'voting' | 'ended';
  date: string;
}

interface Prize {
  id: string;
  competitionTitle: string;
  place: string;
  amount: number;
  date: string;
  claimed: boolean;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'profile' | 'competitions' | 'judging' | 'prizes'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState('crypto_innovator');

  const userCompetitions: UserCompetition[] = [
    { id: '1', title: 'Web3 Hackathon 2024', role: 'participant', status: 'ended', date: '2024-05-01' },
    { id: '2', title: 'AI Innovation Challenge', role: 'sponsor', status: 'voting', date: '2024-05-15' },
    { id: '3', title: 'DeFi Protocol Pitch', role: 'participant', status: 'active', date: '2024-04-30' },
  ];

  const judgingTasks: UserCompetition[] = [
    { id: '4', title: 'Climate Tech Solutions', role: 'judge', status: 'voting', date: '2024-05-15' },
    { id: '5', title: 'Gaming & Metaverse', role: 'judge', status: 'active', date: '2024-05-05' },
  ];

  const prizes: Prize[] = [
    { id: '1', competitionTitle: 'Web3 Hackathon 2024', place: '2nd Place', amount: 150000, date: '2024-05-01', claimed: true },
    { id: '2', competitionTitle: 'DAO Governance Grants', place: '1st Place', amount: 250000, date: '2024-04-20', claimed: true },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-lime-400/20 border-lime-400/50 text-lime-300';
      case 'voting':
        return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
      case 'ended':
        return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
      default:
        return '';
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              My Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-400">Manage your competitions, judging tasks, and prizes</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-40 border-b border-cyan-500/10 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto justify-center">
            {(['profile', 'competitions', 'judging', 'prizes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-300'
                    : 'border-transparent text-gray-400 hover:text-cyan-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <div className="glass-card p-8 border-cyan-500/20">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-cyan-300 hover:border-cyan-500/50 transition-colors duration-300"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Wallet Address</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 bg-black/30 border border-cyan-500/10 rounded text-cyan-300 font-mono text-sm">
                          0x1234567890123456789012345678901234567890
                        </code>
                        <button className="p-2 hover:bg-cyan-500/10 rounded transition-colors duration-300">
                          <Copy className="w-5 h-5 text-gray-400 hover:text-cyan-300" />
                        </button>
                      </div>
                    </div>

                    {isEditingProfile ? (
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Username</label>
                        <p className="text-white text-lg">{username}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Reputation Score</label>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-cyan-300">4.8 / 5.0</div>
                        <div className="text-sm text-gray-400">Based on 24 completed competitions</div>
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div className="flex gap-3 pt-4 border-t border-cyan-500/10">
                        <button className="btn-neon-cyan flex-1">Save Changes</button>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="btn-ghost-neon flex-1"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                <div className="glass-card p-6 border-cyan-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Account Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Total Prize Won</div>
                      <div className="text-2xl font-bold text-lime-300">$400K</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Competitions Joined</div>
                      <div className="text-2xl font-bold text-cyan-300">3</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Judging Tasks</div>
                      <div className="text-2xl font-bold text-purple-300">2</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 border-purple-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Member Since</h3>
                  <p className="text-gray-400">January 15, 2024</p>
                  <div className="mt-4 text-sm badge-primary">
                    Verified on-chain
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Competitions Tab */}
          {activeTab === 'competitions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">My Competitions</h2>
              {userCompetitions.map((comp, index) => (
                <div
                  key={comp.id}
                  className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 transition-all duration-300 animate-float-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 mb-2">
                        {comp.title}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <span className="badge-primary text-xs">
                          {comp.role === 'sponsor' ? 'Sponsor' : comp.role === 'participant' ? 'Participant' : 'Judge'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(comp.status)}`}>
                          {comp.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-3">{comp.date}</div>
                      <Link href={`/competition/${comp.id}`} className="btn-ghost-neon text-sm py-2">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Judging Tab */}
          {activeTab === 'judging' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Judging Tasks</h2>
              {judgingTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="glass-card p-6 border-purple-500/20 group hover:border-purple-500/50 transition-all duration-300 animate-float-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 mb-2">
                        {task.title}
                      </h3>
                      <p className="text-gray-400 mb-3">Judge anonymous identity generated</p>
                      <div className="flex flex-wrap gap-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className="badge-secondary text-xs">Judge ID: jdg_kX9mP2qR4sT5u6V7w</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-3">Due: {task.date}</div>
                      <Link href={`/judge-dashboard?competition=${task.id}`} className="btn-neon-purple text-sm py-2">
                        Judge
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prizes Tab */}
          {activeTab === 'prizes' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Prize Earnings</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="glass-card p-6 border-lime-400/20">
                  <div className="text-sm text-gray-400 mb-1">Total Earned</div>
                  <div className="text-4xl font-bold text-lime-300">$400K</div>
                </div>
                <div className="glass-card p-6 border-cyan-500/20">
                  <div className="text-sm text-gray-400 mb-1">Claimed</div>
                  <div className="text-4xl font-bold text-cyan-300">$400K</div>
                </div>
              </div>

              {prizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="glass-card p-6 border-lime-400/20 group hover:border-lime-400/50 transition-all duration-300 animate-float-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-6 h-6 text-lime-300" />
                        <h3 className="text-xl font-bold text-white">{prize.competitionTitle}</h3>
                      </div>
                      <p className="text-gray-400 mb-3">{prize.place} • {prize.date}</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="badge-primary text-sm">${(prize.amount / 1000).toFixed(0)}K Prize</span>
                        {prize.claimed && <span className="badge-secondary text-sm">Claimed</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-lime-300">${(prize.amount / 1000).toFixed(0)}K</div>
                      {!prize.claimed && <button className="btn-neon-lime text-sm mt-3">Claim Prize</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
