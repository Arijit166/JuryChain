'use client';

import { Calendar, Users, Trophy } from 'lucide-react';
import Link from 'next/link';

interface Competition {
  id: string;
  title: string;
  category: string;
  prizePool: string;
  judges: number;
  submissions: number;
  deadline: string;
  status: 'active' | 'voting' | 'ended';
}

export function ActiveCompetitions() {
  const competitions: Competition[] = [
    {
      id: '1',
      title: 'Web3 Hackathon 2024',
      category: 'Hackathon',
      prizePool: '$500K',
      judges: 12,
      submissions: 234,
      deadline: '2024-04-15',
      status: 'active',
    },
    {
      id: '2',
      title: 'AI Innovation Challenge',
      category: 'Research',
      prizePool: '$250K',
      judges: 8,
      submissions: 156,
      deadline: '2024-05-01',
      status: 'voting',
    },
    {
      id: '3',
      title: 'DeFi Protocol Pitch',
      category: 'Startup',
      prizePool: '$1M',
      judges: 15,
      submissions: 89,
      deadline: '2024-04-30',
      status: 'active',
    },
    {
      id: '4',
      title: 'DAO Governance Grants',
      category: 'Governance',
      prizePool: '$750K',
      judges: 20,
      submissions: 45,
      deadline: '2024-05-15',
      status: 'active',
    },
    {
      id: '5',
      title: 'Climate Tech Solutions',
      category: 'Impact',
      prizePool: '$300K',
      judges: 10,
      submissions: 78,
      deadline: '2024-04-20',
      status: 'voting',
    },
    {
      id: '6',
      title: 'Gaming & Metaverse',
      category: 'Gaming',
      prizePool: '$400K',
      judges: 9,
      submissions: 201,
      deadline: '2024-05-05',
      status: 'active',
    },
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
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Active Competitions
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              Participate and compete for amazing prizes
            </p>
          </div>
          <Link href="/explore" className="btn-ghost-neon hidden md:flex">
            View All
          </Link>
        </div>

        {/* Competitions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((comp, index) => (
            <div
              key={comp.id}
              className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 cursor-pointer transition-all duration-300 animate-float-up"
              style={{ animationDelay: `${(index % 3) * 100}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300">
                    {comp.title}
                  </h3>
                  <span className="text-xs text-gray-400">{comp.category}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(comp.status)}`}>
                  {comp.status}
                </span>
              </div>

              {/* Prize Pool */}
              <div className="mb-6">
                <div className="text-2xl font-bold text-cyan-300 mb-1">{comp.prizePool}</div>
                <div className="text-xs text-gray-400">Prize Pool</div>
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-6 py-4 border-t border-b border-cyan-500/10">
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-purple-300" />
                  <span className="text-gray-400">{comp.judges} Judges</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Trophy className="w-4 h-4 text-lime-300" />
                  <span className="text-gray-400">{comp.submissions} Submissions</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-cyan-300" />
                  <span className="text-gray-400">{comp.deadline}</span>
                </div>
              </div>

              {/* CTA */}
              <button className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold rounded-lg group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300">
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* View All Button (Mobile) */}
        <div className="mt-12 text-center md:hidden">
          <Link href="/explore" className="btn-neon-cyan inline-flex">
            View All Competitions
          </Link>
        </div>
      </div>
    </section>
  );
}
