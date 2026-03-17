'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Calendar, Users, Trophy, Lock, Share2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  prizePool: number;
  judges: number;
  submissions: number;
  deadline: string;
  votingDeadline: string;
  status: 'submissions' | 'voting' | 'results';
  rules: string[];
  judgeAddresses: string[];
}

export default function CompetitionDetails({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'voting'>('overview');

  // Mock competition data
  const competition: Competition = {
    id: params.id,
    title: 'Web3 Hackathon 2024',
    description: 'Build the future of decentralized applications. This hackathon challenges developers to create innovative Web3 solutions that solve real-world problems.',
    category: 'Hackathon',
    prizePool: 500000,
    judges: 12,
    submissions: 234,
    deadline: '2024-04-15',
    votingDeadline: '2024-04-30',
    status: 'voting',
    rules: [
      'All code must be open source',
      'Teams must submit a working demo',
      'Previous hackathon winners are welcome',
      'Maximum team size: 5 members',
      'Projects must be built during hackathon duration',
    ],
    judgeAddresses: [
      '0x1234...5678',
      '0x2345...6789',
      '0x3456...7890',
    ],
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="badge-primary">{competition.category}</span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${competition.status === 'submissions' ? 'bg-lime-400/20 border-lime-400/50 text-lime-300' :
                    competition.status === 'voting' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' :
                      'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    }`}>
                    {competition.status === 'submissions' ? 'Accepting Submissions' :
                      competition.status === 'voting' ? 'Voting Phase' :
                        'Results Available'}
                  </span>
                </div>
                <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">{competition.title}</h1>
                <p className="text-xl text-gray-400">{competition.description}</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-colors duration-300 text-cyan-300">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="sticky top-16 z-40 border-b border-cyan-500/10 bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {(['overview', 'timeline', 'voting'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 font-semibold transition-all duration-300 border-b-2 ${activeTab === tab
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
        <section className="relative py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Rules Section */}
                  <div className="glass-card p-8 border-cyan-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4">Competition Rules</h2>
                    <ul className="space-y-3">
                      {competition.rules.map((rule, idx) => (
                        <li key={idx} className="flex gap-3 text-gray-400">
                          <span className="text-cyan-300 font-bold min-w-fit">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prize Distribution */}
                  <div className="glass-card p-8 border-purple-500/20">
                    <h2 className="text-2xl font-bold text-white mb-6">Prize Distribution</h2>
                    <div className="space-y-4">
                      {[
                        { place: '1st Place', prize: '$250K', percentage: 50 },
                        { place: '2nd Place', prize: '$150K', percentage: 30 },
                        { place: '3rd Place', prize: '$100K', percentage: 20 },
                      ].map((award, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-semibold">{award.place}</span>
                            <span className="text-cyan-300 font-bold">{award.prize}</span>
                          </div>
                          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                              style={{ width: `${award.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Prize Pool Card */}
                  <div className="glass-card p-6 border-lime-400/20">
                    <div className="text-sm text-gray-400 mb-2">Total Prize Pool</div>
                    <div className="text-4xl font-bold text-lime-300 mb-4">${(competition.prizePool / 1000).toFixed(0)}K</div>
                    <div className="flex items-center gap-2 text-sm text-green-400 mb-4">
                      <Lock className="w-4 h-4" />
                      <span>Escrowed & Verified</span>
                    </div>
                    <Link href={`/submit-project/${competition.id}`} className="btn-neon-lime w-full text-center">
                      Submit Project
                    </Link>
                  </div>

                  {/* Stats Card */}
                  <div className="glass-card p-6 border-cyan-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-300" />
                      <div>
                        <div className="text-sm text-gray-400">Judges</div>
                        <div className="text-2xl font-bold text-white">{competition.judges}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-lime-300" />
                      <div>
                        <div className="text-sm text-gray-400">Submissions</div>
                        <div className="text-2xl font-bold text-white">{competition.submissions}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-cyan-300" />
                      <div>
                        <div className="text-sm text-gray-400">Deadline</div>
                        <div className="text-lg font-bold text-white">{competition.deadline}</div>
                      </div>
                    </div>
                  </div>

                  {/* Judge Section */}
                  <div className="glass-card p-6 border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-3">Judges</h3>
                    <div className="space-y-2 mb-4">
                      {competition.judgeAddresses.map((addr, idx) => (
                        <div key={idx} className="text-sm text-gray-400 font-mono">
                          {addr}
                        </div>
                      ))}
                    </div>
                    <Link href={`/judge-dashboard?competition=${competition.id}`} className="btn-ghost-neon w-full text-center text-sm py-2">
                      Judge This
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="max-w-2xl">
                <div className="space-y-6">
                  {[
                    { phase: 'Submissions', start: '2024-03-15', end: '2024-04-15', status: 'active', description: 'Teams submit their projects and demos' },
                    { phase: 'Voting', start: '2024-04-16', end: '2024-04-30', status: 'pending', description: 'Judges review and vote on projects' },
                    { phase: 'Results', start: '2024-05-01', end: '2024-05-01', status: 'pending', description: 'Winners announced and prizes distributed' },
                  ].map((item, idx) => (
                    <div key={idx} className="glass-card p-6 border-cyan-500/20 flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${item.status === 'active' ? 'bg-cyan-500' : 'bg-gray-600'}`}></div>
                        {idx < 2 && <div className="w-1 h-12 bg-gradient-to-b from-cyan-500/50 to-gray-600/50 my-2"></div>}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">{item.phase}</h3>
                        <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                        <div className="text-xs text-gray-500">
                          {item.start} → {item.end}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'voting' && (
              <div className="max-w-2xl">
                <div className="glass-card p-8 border-cyan-500/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Voting Progress</h2>

                  {/* Vote Count */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Votes Cast</span>
                      <span className="text-cyan-300 font-bold">8 / 12</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
                    </div>
                  </div>

                  {/* Commit/Reveal Info */}
                  <div className="space-y-4 mb-8 p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                    <div>
                      <h3 className="text-white font-semibold mb-2">Commit Phase</h3>
                      <p className="text-sm text-gray-400">
                        Judges submit vote commitments (hash of vote + secret). This phase ends on 2024-04-25.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">Reveal Phase</h3>
                      <p className="text-sm text-gray-400">
                        After commit phase closes, judges reveal their votes using the original secret. Votes are verified on-chain.
                      </p>
                    </div>
                  </div>

                  {/* Judge Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                      <div className="text-sm text-gray-400 mb-1">Total Judges</div>
                      <div className="text-2xl font-bold text-cyan-300">{competition.judges}</div>
                    </div>
                    <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                      <div className="text-sm text-gray-400 mb-1">Voted</div>
                      <div className="text-2xl font-bold text-lime-300">8</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
