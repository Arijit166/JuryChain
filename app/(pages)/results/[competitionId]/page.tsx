'use client';

import { Navbar } from '@/components/layout/navbar';
import { Trophy, ExternalLink, CheckCircle, Zap } from 'lucide-react';
import { useState, useEffect } from 'react'
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Winner {
  rank: number;
  projectName: string;
  teamAddress: string;
  votes: number;
  prizeAmount: number;
  prizeStatus: 'pending' | 'released';
}

export default function Results({ params }: { params: { competitionId: string } }) {
  const [realResults, setRealResults] = useState<any[]>([]);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/votes/results/${params.competitionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.results) {
          setRealResults(data.results);
          setTotalVotesCast(data.totalVotesCast ?? 0);
        }
      })
      .finally(() => setResultsLoading(false));
  }, [params.competitionId]);

  const winners: Winner[] = realResults.slice(0, 3).map((r, idx) => ({
    rank: idx + 1,
    projectName: r.projectTitle,
    teamAddress: r.submittedBy
      ? `${r.submittedBy.slice(0, 6)}…${r.submittedBy.slice(-4)}`
      : r.teamName,
    votes: r.voteCount,
    prizeAmount: 0,
    prizeStatus: 'pending' as const,
  }));

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10 bg-gradient-to-b from-cyan-950/30 to-transparent">
          <div className="max-w-7xl mx-auto text-center">
            <Zap className="w-16 h-16 text-cyan-300 mx-auto mb-4" />
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-lime-300 to-cyan-300 bg-clip-text text-transparent">
                Results Announced!
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Web3 Hackathon 2024 voting has concluded. Winners have been determined through our trustless voting protocol.
            </p>
          </div>
        </section>

        {/* Success Banner */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto glass-card p-6 border-lime-400/20 bg-lime-400/5 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-lime-300 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-lime-300 mb-1">Prizes Released</h3>
              <p className="text-sm text-gray-400">
                All prizes have been automatically transferred to winners' wallets via smart contract.
              </p>
            </div>
          </div>
        </section>

        {/* Winners Display */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {winners.map((winner, index) => (
                <div
                  key={winner.rank}
                  className={`glass-card p-8 border transition-all duration-300 group hover:border-opacity-100 ${winner.rank === 1
                    ? 'border-yellow-400/50 bg-yellow-400/5 lg:scale-105'
                    : winner.rank === 2
                      ? 'border-cyan-500/30'
                      : 'border-cyan-500/20'
                    } animate-float-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-6 mb-6">
                    {/* Rank Badge */}
                    <div className="relative">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${winner.rank === 1
                          ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 text-black shadow-lg shadow-yellow-500/50'
                          : winner.rank === 2
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-400 text-black shadow-lg shadow-cyan-500/50'
                            : 'bg-gradient-to-br from-purple-500 to-pink-400 text-black shadow-lg shadow-purple-500/50'
                          }`}
                      >
                        {winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : '🥉'}
                      </div>
                    </div>

                    {/* Winner Info */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                        {winner.projectName}
                      </h3>
                      <p className="text-gray-400 mb-3">Team: {winner.teamAddress}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="badge-primary">
                          {winner.votes} votes received
                        </span>
                      </div>
                    </div>

                    {/* Prize Info */}
                    <div className="text-right">
                      <div className="text-4xl font-bold text-lime-300 mb-2">
                        ${(winner.prizeAmount / 1000).toFixed(0)}K
                      </div>
                      <div className="flex items-center gap-1 text-sm text-green-400 justify-end">
                        <CheckCircle className="w-4 h-4" />
                        Released
                      </div>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  <div className="pt-6 border-t border-cyan-500/10">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Prize Distribution TX</div>
                        <div className="text-sm font-mono text-cyan-300 break-all hover:text-cyan-200 transition-colors">
                          0x4a2c9e7d3f1b5e8a6c9d2f4e7a1c3d5e
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Smart Contract</div>
                        <div className="text-sm font-mono text-purple-300">
                          jurychain.eth
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Stats */}
            <div className="mt-12 glass-card p-8 border-cyan-500/20">
              <h2 className="text-2xl font-bold text-white mb-6">Final Statistics</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                  <div className="text-sm text-gray-400 mb-1">Total Prize Distributed</div>
                  <div className="text-2xl font-bold text-cyan-300">$500K</div>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-purple-500/10">
                  <div className="text-sm text-gray-400 mb-1">Total Votes Cast</div>
                  <div className="text-2xl font-bold text-purple-300">1,247</div>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-lime-400/10">
                  <div className="text-sm text-gray-400 mb-1">Total Judges</div>
                  <div className="text-2xl font-bold text-lime-300">12</div>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-orange-500/10">
                  <div className="text-sm text-gray-400 mb-1">Total Submissions</div>
                  <div className="text-2xl font-bold text-orange-300">234</div>
                </div>
              </div>
            </div>

            {/* Transparency Info */}
            <div className="mt-8 glass-card p-8 border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Transparent & Verifiable</h3>
              <p className="text-gray-400 mb-6">
                All voting commitments, judge identities, and prize distributions are verifiable on-chain. Any participant can verify the integrity of this competition.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/transparency-explorer?competition=${params.competitionId}`}
                  className="btn-ghost-neon flex items-center justify-center gap-2"
                >
                  View Transparency Details
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link href="/" className="btn-neon-cyan flex items-center justify-center gap-2">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
