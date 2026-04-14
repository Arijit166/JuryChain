'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Copy, Award, Edit2, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  user: { email?: string; name?: string; profileImage?: string; walletAddress: string; createdAt: string } | null;
  stats: {
    totalPrizeWon: number;
    competitionsJoined: number;
    competitionsSponsored: number;
    judgingTasks: number;
    votesSubmitted: number;
    memberSince: string | null;
  };
  sponsored: Array<{
    id: string; title: string; status: string; prizePoolPOL: number;
    numWinners: number; startDate: string; submissionDeadline: string;
    votingDeadline: string; category: string; txHash: string | null;
  }>;
  participating: Array<{
    id: string; title: string; status: string; prizePoolPOL: number;
    startDate: string; submissionDeadline: string; category: string;
    hasSubmitted: boolean; teamName: string;
  }>;
  judging: Array<{
    id: string; title: string; status: string;
    votingDeadline: string; hasVoted: boolean; totalJudges: number;
  }>;
  prizes: Array<{
    competitionId: string; competitionTitle: string; rank: number;
    prizeAmount: number; pct: number; txHash: string | null; date: string;
  }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const RANK_LABEL: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place', 4: '4th Place', 5: '5th Place' };

function statusClasses(status: string) {
  switch (status) {
    case 'live': return 'bg-lime-400/20 border-lime-400/50 text-lime-300';
    case 'voting': return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
    case 'completed': return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
    case 'pending_tx': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
    default: return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded border ${statusClasses(status)}`}>
      {status === 'pending_tx' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'competitions' | 'judging' | 'prizes'>('profile');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!userInfo?.walletAddress) return;
    setLoading(true);
    fetch(`/api/dashboard?wallet=${userInfo.walletAddress.toLowerCase()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);
        setEditedName(d.user?.name ?? userInfo.name ?? '');
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [userInfo?.walletAddress]);

  const copyAddress = () => {
    if (!userInfo?.walletAddress) return;
    navigator.clipboard.writeText(userInfo.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveName = async () => {
    if (!userInfo?.walletAddress) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/auth/upsert-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userInfo, name: editedName }),
      });
      if (res.ok) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            user: prev.user
              ? { ...prev.user, name: editedName }
              : { walletAddress: userInfo.walletAddress!, createdAt: '', name: editedName },
          };
        });
        setIsEditingName(false);
      }
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <Navbar />
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <Navbar />
          <div className="flex justify-center items-center min-h-[60vh]">
            <p className="text-red-400">{error}</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const wallet = userInfo?.walletAddress ?? '';
  const shortWallet = wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '—';
  const { stats, sponsored, participating, judging, prizes } = data ?? {
    stats: { totalPrizeWon: 0, competitionsJoined: 0, competitionsSponsored: 0, judgingTasks: 0, votesSubmitted: 0, memberSince: null },
    sponsored: [], participating: [], judging: [], prizes: [],
  };

  const allMyComps = [
    ...participating.map(c => ({ ...c, role: 'participant' as const })),
  ].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <ProtectedRoute>
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
              {(['profile', 'competitions', 'judging', 'prizes'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-cyan-500 text-cyan-300' : 'border-transparent text-gray-400 hover:text-cyan-300'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'judging' && judging.filter(j => !j.hasVoted && j.status === 'voting').length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-cyan-500 text-black rounded-full font-bold">
                      {judging.filter(j => !j.hasVoted && j.status === 'voting').length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 border-cyan-500/20">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                    <button onClick={() => setIsEditingName(!isEditingName)}
                      className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-cyan-300 hover:border-cyan-500/50 transition-colors">
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  </div>

                  {/* Avatar + name row */}
                  <div className="flex items-center gap-4 mb-6">
                    {userInfo?.profileImage
                      ? <img src={userInfo.profileImage} alt="avatar" className="w-14 h-14 rounded-full border border-cyan-500/30" />
                      : <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl font-bold text-cyan-300">
                        {(editedName || data?.user?.name || userInfo?.name || '?')[0].toUpperCase()}
                      </div>}
                    <div>
                      <p className="text-white font-semibold text-lg">{data?.user?.name || userInfo?.name || 'Anonymous'}</p>
                      <p className="text-gray-400 text-sm">{data?.user?.email ?? userInfo?.email ?? '—'}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Wallet */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Wallet Address</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 bg-black/30 border border-cyan-500/10 rounded text-cyan-300 font-mono text-sm truncate">
                          {wallet}
                        </code>
                        <button onClick={copyAddress} className="p-2 hover:bg-cyan-500/10 rounded transition-colors">
                          {copied
                            ? <CheckCircle className="w-5 h-5 text-lime-400" />
                            : <Copy className="w-5 h-5 text-gray-400 hover:text-cyan-300" />}
                        </button>
                      </div>
                    </div>

                    {/* Display name (editable) */}
                    {isEditingName ? (
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Display Name</label>
                        <input value={editedName} onChange={e => setEditedName(e.target.value)}
                          className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                        <div className="flex gap-3 mt-3">
                          <button onClick={saveName} disabled={savingName} className="btn-neon-cyan flex-1 flex items-center justify-center gap-2">
                            {savingName && <RefreshCw className="w-4 h-4 animate-spin" />} Save
                          </button>
                          <button onClick={() => setIsEditingName(false)} className="btn-ghost-neon flex-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Display Name</label>
                        <p className="text-white text-lg">{data?.user?.name || userInfo?.name || '—'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats sidebar */}
                <div className="space-y-6">
                  <div className="glass-card p-6 border-cyan-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Account Stats</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Total Prize Won</div>
                        <div className="text-2xl font-bold text-lime-300">
                          {stats.totalPrizeWon > 0 ? `${stats.totalPrizeWon.toFixed(2)} POL` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Competitions Joined</div>
                        <div className="text-2xl font-bold text-cyan-300">{stats.competitionsJoined}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Competitions Sponsored</div>
                        <div className="text-2xl font-bold text-purple-300">{stats.competitionsSponsored}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Judging Tasks</div>
                        <div className="text-2xl font-bold text-orange-300">{stats.judgingTasks}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Votes Cast</div>
                        <div className="text-2xl font-bold text-pink-300">{stats.votesSubmitted}</div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-2">Member Since</h3>
                    <p className="text-gray-400">
                      {stats.memberSince ? fmtDate(stats.memberSince) : '—'}
                    </p>
                    <div className="mt-4 text-sm badge-primary">Verified on-chain</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Competitions Tab ── */}
            {activeTab === 'competitions' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">My Joined Competitions</h2>
                {allMyComps.length === 0 ? (
                  <div className="glass-card p-12 border-cyan-500/20 text-center">
                    <p className="text-gray-400">You haven't joined any competitions yet.</p>
                    <Link href="/explore" className="btn-neon-cyan inline-block mt-4">Explore Competitions</Link>
                  </div>
                ) : allMyComps.map((comp, i) => (
                  <div key={comp.id}
                    className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 transition-all duration-300 animate-float-up"
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2 truncate">
                          {comp.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="badge-primary text-xs">
                            Participant
                          </span>
                          <StatusBadge status={comp.status} />
                          <span className="px-2 py-1 text-xs rounded border border-gray-500/30 text-gray-400">{comp.category}</span>
                          {'hasSubmitted' in comp && comp.hasSubmitted && (
                            <span className="px-2 py-1 text-xs rounded border border-lime-400/30 text-lime-300 bg-lime-400/10">Submitted</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-gray-400 mb-1">{fmtDate(comp.startDate)}</div>
                        {'prizePoolPOL' in comp && comp.prizePoolPOL > 0 && (
                          <div className="text-sm font-bold text-lime-300 mb-2">{comp.prizePoolPOL} POL</div>
                        )}
                        <Link href={`/competition/${comp.id}`} className="btn-ghost-neon text-sm py-1.5 px-3">View</Link>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4 pt-2 border-t border-cyan-500/10">
                      <span>Submission: {fmtDate(comp.submissionDeadline)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Judging Tab ── */}
            {activeTab === 'judging' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Judging Tasks</h2>
                {judging.length === 0 ? (
                  <div className="glass-card p-12 border-purple-500/20 text-center">
                    <p className="text-gray-400">You haven't been assigned as a judge to any competitions yet.</p>
                  </div>
                ) : judging.map((task, i) => (
                  <div key={task.id}
                    className="glass-card p-6 border-purple-500/20 group hover:border-purple-500/50 transition-all duration-300 animate-float-up"
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2 truncate">
                          {task.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">
                          {task.totalJudges} judge{task.totalJudges !== 1 ? 's' : ''} total
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={task.status} />
                          {task.hasVoted
                            ? <span className="px-2 py-1 text-xs rounded border border-lime-400/30 bg-lime-400/10 text-lime-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Voted</span>
                            : task.status === 'voting' && <span className="px-2 py-1 text-xs rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">Action needed</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-gray-400 mb-3">
                          Due: {fmtDate(task.votingDeadline)}
                        </div>
                        {task.status === 'upcoming' || task.status === 'live' ? (
                          <div className="inline-block py-2 px-4 rounded border border-gray-500/50 bg-gray-500/20 text-gray-500 text-sm cursor-not-allowed">
                            Voting Not Started
                          </div>
                        ) : task.status === 'completed' || task.status === 'pending_tx' ? (
                          <div className="inline-block py-2 px-4 rounded border border-gray-500/50 bg-gray-500/20 text-gray-400 text-sm cursor-not-allowed">
                            Ended
                          </div>
                        ) : (
                          <Link href={`/vote/${task.id}`} className="btn-neon-purple text-sm py-2 px-4">
                            {task.hasVoted ? 'Review' : 'Judge'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Prizes Tab ── */}
            {activeTab === 'prizes' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Prize Earnings</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="glass-card p-6 border-lime-400/20">
                    <div className="text-sm text-gray-400 mb-1">Total Earned</div>
                    <div className="text-4xl font-bold text-lime-300">
                      {stats.totalPrizeWon > 0 ? `${stats.totalPrizeWon.toFixed(2)} POL` : '—'}
                    </div>
                  </div>
                  <div className="glass-card p-6 border-cyan-500/20">
                    <div className="text-sm text-gray-400 mb-1">Competitions Won</div>
                    <div className="text-4xl font-bold text-cyan-300">{prizes.length}</div>
                  </div>
                </div>

                {prizes.length === 0 ? (
                  <div className="glass-card p-12 border-lime-400/20 text-center">
                    <p className="text-gray-400">No prizes yet. Join a competition to get started!</p>
                    <Link href="/explore" className="btn-neon-cyan inline-block mt-4">Explore Competitions</Link>
                  </div>
                ) : prizes.map((prize, i) => (
                  <div key={prize.competitionId}
                    className="glass-card p-6 border-lime-400/20 group hover:border-lime-400/50 transition-all duration-300 animate-float-up"
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-6 h-6 text-lime-300 flex-shrink-0" />
                          <h3 className="text-xl font-bold text-white truncate">{prize.competitionTitle}</h3>
                        </div>
                        <p className="text-gray-400 mb-3">
                          {RANK_LABEL[prize.rank] ?? `#${prize.rank} Place`} • {prize.date}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="badge-primary text-sm">{prize.prizeAmount.toFixed(2)} POL ({prize.pct}%)</span>
                          <span className="badge-secondary text-sm">Auto-distributed</span>
                          {prize.txHash && (
                            <a href={`https://amoy.polygonscan.com/tx/${prize.txHash}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-cyan-500/30 text-cyan-300 hover:text-cyan-200">
                              <ExternalLink className="w-3 h-3" /> Tx
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-3xl font-bold text-lime-300">{prize.prizeAmount.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">POL</div>
                        <Link href={`/competition/${prize.competitionId}/results`}
                          className="btn-ghost-neon text-xs mt-2 inline-block py-1 px-3">
                          Results
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}