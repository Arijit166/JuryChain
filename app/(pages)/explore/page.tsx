'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Search, Filter, SortAsc, Calendar, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Competition {
  id: string;
  title: string;
  category: string;
  prizePool: number;
  judges: number;
  submissions: number;
  deadline: string;
  status: 'active' | 'voting' | 'ended';
  description: string;
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'prize' | 'deadline' | 'popular'>('prize');

  const competitions: Competition[] = [
    {
      id: '1',
      title: 'Web3 Hackathon 2024',
      category: 'Hackathon',
      prizePool: 500000,
      judges: 12,
      submissions: 234,
      deadline: '2024-04-15',
      status: 'voting',
      description: 'Build innovative dApps and Web3 solutions',
    },
    {
      id: '2',
      title: 'AI Innovation Challenge',
      category: 'Research',
      prizePool: 250000,
      judges: 8,
      submissions: 156,
      deadline: '2024-05-01',
      status: 'voting',
      description: 'Advance AI and machine learning research',
    },
    {
      id: '3',
      title: 'DeFi Protocol Pitch',
      category: 'Startup',
      prizePool: 1000000,
      judges: 15,
      submissions: 89,
      deadline: '2024-04-30',
      status: 'active',
      description: 'Pitch revolutionary DeFi protocols',
    },
    {
      id: '4',
      title: 'DAO Governance Grants',
      category: 'Governance',
      prizePool: 750000,
      judges: 20,
      submissions: 45,
      deadline: '2024-05-15',
      status: 'active',
      description: 'Improve decentralized governance systems',
    },
    {
      id: '5',
      title: 'Climate Tech Solutions',
      category: 'Impact',
      prizePool: 300000,
      judges: 10,
      submissions: 78,
      deadline: '2024-04-20',
      status: 'voting',
      description: 'Solutions for environmental challenges',
    },
    {
      id: '6',
      title: 'Gaming & Metaverse',
      category: 'Gaming',
      prizePool: 400000,
      judges: 9,
      submissions: 201,
      deadline: '2024-05-05',
      status: 'active',
      description: 'Create immersive gaming experiences',
    },
  ];

  const categories = ['All', 'Hackathon', 'Research', 'Startup', 'Governance', 'Impact', 'Gaming'];

  const filteredCompetitions = competitions
    .filter((comp) => {
      const matchesSearch = comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === 'All' || comp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'prize') return b.prizePool - a.prizePool;
      if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortBy === 'popular') return b.submissions - a.submissions;
      return 0;
    });

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
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
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

        {/* Search and Filter */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10 sticky top-16 z-40 bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search competitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-gray-400 hover:text-cyan-300 transition-all duration-300">
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap ${selectedCategory === cat || (!selectedCategory && cat === 'All')
                    ? 'bg-cyan-500 text-black'
                    : 'bg-black/50 border border-cyan-500/30 text-gray-400 hover:border-cyan-500/50'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="mt-4 flex gap-2">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <SortAsc className="w-4 h-4" /> Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'prize' | 'deadline' | 'popular')}
                className="px-3 py-1 bg-black/50 border border-cyan-500/30 rounded text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="prize">Highest Prize</option>
                <option value="deadline">Deadline</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </section>

        {/* Competitions Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {filteredCompetitions.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompetitions.map((comp, index) => (
                  <Link
                    key={comp.id}
                    href={`/competition/${comp.id}`}
                    className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 cursor-pointer transition-all duration-300 animate-float-up"
                    style={{ animationDelay: `${(index % 3) * 100}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300">
                          {comp.title}
                        </h3>
                        <span className="text-xs text-gray-400">{comp.category}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(comp.status)}`}>
                        {comp.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{comp.description}</p>

                    {/* Prize */}
                    <div className="mb-6">
                      <div className="text-2xl font-bold text-cyan-300">${(comp.prizePool / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-400">Prize Pool</div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 mb-6 py-4 border-t border-b border-cyan-500/10">
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
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 border-cyan-500/20 text-center">
                <p className="text-gray-400 mb-4">No competitions found matching your search.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="btn-ghost-neon"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Create Competition CTA */}
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
