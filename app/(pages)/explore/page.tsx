'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Search, Calendar, Users, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Competition {
  _id: string;
  title: string;
  description: string;
  prizePool: string;
  numWinners: number;
  startDate: string;
  submissionDeadline: string;
  votingDeadline: string;
  judges: Array<{ type: string; value: string }>;
  isPublic: boolean;
  status: string;
  venue: string;
  teamSize: number;
  sponsorWallet: string;
  txHash: string | null;
  contractCompetitionId: number | null;
}

type Tab = 'upcoming' | 'live' | 'past';

function classifyCompetition(comp: Competition): Tab {
  const now = Date.now();
  const start = new Date(comp.startDate).getTime();
  const voting = new Date(comp.votingDeadline).getTime();
  const pastCutoff = voting + 5 * 24 * 60 * 60 * 1000; // 5 days after voting ends

  if (now < start) return 'upcoming';
  if (now >= start && now <= voting) return 'live';
  if (now > voting && now <= pastCutoff) return 'past';
  return 'past'; // expired ones still show as past
}

function getStatusBadge(tab: Tab) {
  switch (tab) {
    case 'live':
      return 'bg-lime-400/20 border-lime-400/50 text-lime-300';
    case 'upcoming':
      return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
    case 'past':
      return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
  }
}

function getStatusLabel(tab: Tab) {
  switch (tab) {
    case 'live': return 'Live';
    case 'upcoming': return 'Upcoming';
    case 'past': return 'Ended';
  }
}

function timeLabel(comp: Competition, tab: Tab): string {
  const now = Date.now();
  if (tab === 'upcoming') {
    const diff = new Date(comp.startDate).getTime() - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `Starts in ${days}d`;
  }
  if (tab === 'live') {
    const diff = new Date(comp.submissionDeadline).getTime() - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d left to submit` : 'Voting phase';
  }
  return `Ended ${new Date(comp.votingDeadline).toLocaleDateString()}`;
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/competitions/list')
      .then((r) => r.json())
      .then((data) => setCompetitions(data.competitions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const classified = competitions.filter((c) => classifyCompetition(c) === activeTab);

  const filtered = classified.filter((comp) =>
    comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: Tab[] = ['live', 'upcoming', 'past'];
  const counts = {
    live: competitions.filter((c) => classifyCompetition(c) === 'live').length,
    upcoming: competitions.filter((c) => classifyCompetition(c) === 'upcoming').length,
    past: competitions.filter((c) => classifyCompetition(c) === 'past').length,
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Explore Competitions
              </span>
            </h1>
            <p className="text-lg text-gray-400">Find competitions and showcase your innovation</p>
          </div>
        </section>

        {/* Search + Tabs */}
        <section className="py-6 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10 sticky top-16 z-40 bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
            {/* Search */}
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 justify-center">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === tab
                      ? 'bg-cyan-500 text-black'
                      : 'bg-black/50 border border-cyan-500/30 text-gray-400 hover:border-cyan-500/50'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-black/30' : 'bg-cyan-500/20 text-cyan-300'}`}>
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((comp, index) => {
                  const tab = classifyCompetition(comp);
                  return (
                    <Link
                      key={comp._id}
                      href={`/competition/${comp._id}`}
                      className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 cursor-pointer transition-all duration-300 animate-float-up"
                      style={{ animationDelay: `${(index % 3) * 100}ms` }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300">
                            {comp.title}
                          </h3>
                          <span className="text-xs text-gray-400">{comp.venue}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded border shrink-0 ml-2 ${getStatusBadge(tab)}`}>
                          {getStatusLabel(tab)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{comp.description}</p>

                      {/* Prize */}
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-cyan-300">{comp.prizePool} POL</div>
                        <div className="text-xs text-gray-400">Prize Pool</div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-4 py-4 border-t border-b border-cyan-500/10">
                        <div className="flex items-center gap-3 text-sm">
                          <Users className="w-4 h-4 text-purple-300" />
                          <span className="text-gray-400">{comp.judges.length} Judges</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Trophy className="w-4 h-4 text-lime-300" />
                          <span className="text-gray-400">{comp.numWinners} Winners</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Clock className="w-4 h-4 text-cyan-300" />
                          <span className="text-gray-400">{timeLabel(comp, tab)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-cyan-300" />
                          <span className="text-gray-400">
                            Submit by {new Date(comp.submissionDeadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold rounded-lg group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300">
                        View Details
                      </button>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card p-12 border-cyan-500/20 text-center">
                <p className="text-gray-400 mb-2">
                  No {activeTab} competitions found{searchQuery ? ' matching your search' : ''}.
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="btn-ghost-neon mt-4">
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/10">
          <div className="max-w-7xl mx-auto glass-card p-12 border-purple-500/20 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Want to Host a Competition?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Create your own trustless competition with smart contracts and cryptographic judging
            </p>
            <Link href="/create-competition" className="btn-neon-purple inline-flex">
              Create Competition
            </Link>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}