'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Search, Filter, Eye, Copy, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface TransparencyRecord {
  id: string;
  type: 'competition' | 'vote' | 'proof' | 'transaction';
  title: string;
  timestamp: string;
  hash: string;
  status: 'verified' | 'pending';
}

export default function TransparencyExplorer() {
  const [activeTab, setActiveTab] = useState<'competitions' | 'votes' | 'proofs' | 'transactions'>('competitions');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const records: TransparencyRecord[] = [
    {
      id: '1',
      type: 'competition',
      title: 'Web3 Hackathon 2024',
      timestamp: '2024-03-15 10:30:45 UTC',
      hash: '0x4a2c9e7d3f1b5e8a6c9d2f4e7a1c3d5e6f7a8b9c',
      status: 'verified',
    },
    {
      id: '2',
      type: 'vote',
      title: 'Judge Vote Commitment - Hackathon',
      timestamp: '2024-04-20 14:22:30 UTC',
      hash: '0x1234567890abcdef1234567890abcdef12345678',
      status: 'verified',
    },
    {
      id: '3',
      type: 'proof',
      title: 'ZK Proof - Vote Validity #001',
      timestamp: '2024-04-25 09:15:22 UTC',
      hash: '0xabcdef1234567890abcdef1234567890abcdef12',
      status: 'verified',
    },
    {
      id: '4',
      type: 'transaction',
      title: 'Prize Distribution TX - $500K Released',
      timestamp: '2024-05-01 16:45:10 UTC',
      hash: '0x7890abcdef1234567890abcdef123456789abcde',
      status: 'verified',
    },
    {
      id: '5',
      type: 'competition',
      title: 'AI Innovation Challenge',
      timestamp: '2024-03-20 11:20:15 UTC',
      hash: '0xdef1234567890abcdef1234567890abcdef12345',
      status: 'verified',
    },
    {
      id: '6',
      type: 'vote',
      title: 'Judge Vote Commitment - AI Challenge',
      timestamp: '2024-04-25 13:30:45 UTC',
      hash: '0x567890abcdef1234567890abcdef123456789abc',
      status: 'verified',
    },
  ];

  const tabTypeMap: Record<typeof activeTab, TransparencyRecord['type']> = {
    competitions: 'competition',
    votes: 'vote',
    proofs: 'proof',
    transactions: 'transaction',
  };

  const filteredRecords = records.filter((record) => {
    const matchesTab = record.type === tabTypeMap[activeTab];
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Transparency Explorer
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              Verify all competition data, votes, and smart contract transactions on-chain
            </p>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10 sticky top-16 z-40 bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              {/* Filter Button */}
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-gray-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all duration-300">
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="border-b border-cyan-500/10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8 overflow-x-auto">
              {(['competitions', 'votes', 'proofs', 'transactions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${activeTab === tab
                    ? 'border-cyan-500 text-cyan-300'
                    : 'border-transparent text-gray-400 hover:text-cyan-300'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {' '}
                  <span className="text-xs text-gray-500">({records.filter(r => r.type === tabTypeMap[tab]).length})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {filteredRecords.length > 0 ? (
              <div className="space-y-4">
                {filteredRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 transition-all duration-300 animate-float-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                            {record.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                          <div className="text-sm text-gray-400">
                            {record.timestamp}
                          </div>
                          <span className="badge-primary text-xs">
                            {record.type === 'competition'
                              ? 'Competition'
                              : record.type === 'vote'
                                ? 'Vote Commitment'
                                : record.type === 'proof'
                                  ? 'ZK Proof'
                                  : 'Transaction'}
                          </span>
                        </div>

                        {/* Hash Display */}
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-black/50 rounded border border-cyan-500/10 text-cyan-300 text-sm font-mono overflow-x-auto">
                            {record.hash}
                          </code>
                          <button
                            onClick={() => handleCopyHash(record.hash)}
                            className="p-2 hover:bg-cyan-500/10 rounded transition-colors duration-300"
                            title="Copy hash"
                          >
                            {copiedHash === record.hash ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-400 hover:text-cyan-300" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* View Button */}
                      <button className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-cyan-300 hover:border-cyan-500/50 transition-colors duration-300 whitespace-nowrap">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 border-cyan-500/20 text-center">
                <p className="text-gray-400">No records found matching your search.</p>
              </div>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">How Transparency Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6 border-cyan-500/20">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                  <span className="text-cyan-300 font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Immutable Records</h3>
                <p className="text-gray-400 text-sm">
                  All competition data, votes, and transactions are recorded on-chain and cannot be modified.
                </p>
              </div>
              <div className="glass-card p-6 border-purple-500/20">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <span className="text-purple-300 font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">ZK Proof Verification</h3>
                <p className="text-gray-400 text-sm">
                  Zero-knowledge proofs verify judge authenticity without revealing their identities.
                </p>
              </div>
              <div className="glass-card p-6 border-lime-400/20">
                <div className="w-12 h-12 rounded-lg bg-lime-400/20 flex items-center justify-center mb-4">
                  <span className="text-lime-300 font-bold">3</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Smart Contract Audit</h3>
                <p className="text-gray-400 text-sm">
                  All prize distributions are executed by audited smart contracts with no human intervention.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
