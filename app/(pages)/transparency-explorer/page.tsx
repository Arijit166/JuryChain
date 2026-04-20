'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Search, Filter, Eye, Copy, CheckCircle, Loader2, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type RecordType = 'competition' | 'vote' | 'proof' | 'transaction';

interface TransparencyRecord {
  id: string;
  type: RecordType;
  title: string;
  timestamp: string;
  hash: string;
  status: 'verified' | 'pending';
  link: string | null;
  meta?: Record<string, any>;
}

type TabKey = 'competitions' | 'votes' | 'proofs' | 'transactions';


export default function TransparencyExplorer() {
  const [activeTab, setActiveTab] = useState<TabKey>('competitions');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allRecords, setAllRecords] = useState<{
    competitions: TransparencyRecord[];
    votes: TransparencyRecord[];
    proofs: TransparencyRecord[];
    transactions: TransparencyRecord[];
  }>({ competitions: [], votes: [], proofs: [], transactions: [] });

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/transparency')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch transparency data');
        return r.json();
      })
      .then((data) => {
        setAllRecords({
          competitions: data.competitions || [],
          votes: data.votes || [],
          proofs: data.proofs || [],
          transactions: data.transactions || [],
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const currentRecords = allRecords[activeTab] || [];

  const filteredRecords = currentRecords.filter((record) => {
    const q = searchQuery.toLowerCase();
    return (
      record.title.toLowerCase().includes(q) ||
      record.hash.toLowerCase().includes(q) ||
      (record.meta?.teamName || '').toLowerCase().includes(q) ||
      (record.meta?.category || '').toLowerCase().includes(q)
    );
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const tabs: TabKey[] = ['competitions', 'votes', 'proofs', 'transactions'];

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
                  placeholder="Search by title, hash, or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Filter Button */}
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-gray-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all duration-300"
                title="Clear filter"
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="border-b border-cyan-500/10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8 overflow-x-auto">
              {tabs.map((tab) => (
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
                  {' '}
                  <span className="text-xs text-gray-500">
                    ({allRecords[tab]?.length ?? 0})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Loading transparency records…</span>
              </div>
            ) : error ? (
              <div className="glass-card p-12 border-red-500/20 text-center">
                <p className="text-red-400 mb-2">⚠ {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 btn-ghost-neon text-sm"
                >
                  Retry
                </button>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="space-y-4">
                {filteredRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 transition-all duration-300 animate-float-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                            {record.title}
                          </h3>
                          <div
                            className={`flex items-center gap-1 text-xs ${
                              record.status === 'verified' ? 'text-green-400' : 'text-amber-400'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {record.status === 'verified' ? 'Verified' : 'Pending'}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                          <div className="text-sm text-gray-400">{record.timestamp}</div>
                          <span className="badge-primary text-xs">
                            {record.type === 'competition'
                              ? 'Competition'
                              : record.type === 'vote'
                              ? 'Vote Commitment'
                              : record.type === 'proof'
                              ? 'Submission Proof'
                              : 'Transaction'}
                          </span>
                          {record.meta?.category && (
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20">
                              {record.meta.category}
                            </span>
                          )}
                          {record.meta?.teamName && (
                            <span className="text-xs text-gray-400">
                              Team: <span className="text-cyan-300">{record.meta.teamName}</span>
                            </span>
                          )}
                          {record.meta?.score !== undefined && (
                            <span className="text-xs text-gray-400">
                              Score: <span className="text-lime-300 font-semibold">{record.meta.score}/10</span>
                            </span>
                          )}
                        </div>

                        {/* Hash Display */}
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-black/50 rounded border border-cyan-500/10 text-cyan-300 text-sm font-mono overflow-x-auto min-w-0 truncate">
                            {record.hash}
                          </code>
                          <button
                            onClick={() => handleCopyHash(record.hash)}
                            className="p-2 hover:bg-cyan-500/10 rounded transition-colors duration-300 shrink-0"
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
                      {record.link ? (
                        <Link
                          href={record.link}
                          className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors duration-300 whitespace-nowrap shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="flex items-center gap-2 px-4 py-2 bg-black/30 border border-gray-700/50 rounded-lg text-gray-600 whitespace-nowrap shrink-0 cursor-not-allowed"
                          title="No direct link available"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="hidden sm:inline">On-chain</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 border-cyan-500/20 text-center">
                {searchQuery ? (
                  <>
                    <p className="text-gray-400 mb-4">No records found matching &ldquo;{searchQuery}&rdquo;.</p>
                    <button onClick={() => setSearchQuery('')} className="btn-ghost-neon">
                      Clear Search
                    </button>
                  </>
                ) : (
                  <p className="text-gray-400">No {activeTab} records found.</p>
                )}
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
