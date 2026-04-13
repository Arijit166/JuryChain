'use client';

import { Navbar } from '@/components/layout/navbar';
import { Trophy, ExternalLink, CheckCircle, Zap, Lock, ArrowLeft } from 'lucide-react';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Prize splits (must match competition/[id]/page.tsx)
const SPLITS: Record<number, { label: string; pct: number }[]> = {
  1: [{ label: '1st Place', pct: 100 }],
  3: [
    { label: '1st Place', pct: 50 },
    { label: '2nd Place', pct: 30 },
    { label: '3rd Place', pct: 20 },
  ],
  5: [
    { label: '1st Place', pct: 45 },
    { label: '2nd Place', pct: 30 },
    { label: '3rd Place', pct: 15 },
    { label: '4th Place', pct: 5 },
    { label: '5th Place', pct: 5 },
  ],
  10: [
    { label: '1st', pct: 30 },
    { label: '2nd', pct: 20 },
    { label: '3rd', pct: 15 },
    { label: '4th', pct: 10 },
    { label: '5th', pct: 7 },
    { label: '6th', pct: 7 },
    { label: '7th', pct: 3 },
    { label: '8th', pct: 3 },
    { label: '9th', pct: 2.5 },
    { label: '10th', pct: 2.5 },
  ],
};

function getRankBadge(rank: number) {
  if (rank === 1) return { emoji: '🥇', className: 'bg-gradient-to-br from-yellow-500 to-yellow-400 shadow-lg shadow-yellow-500/50', border: 'border-yellow-400/50 bg-yellow-400/5' };
  if (rank === 2) return { emoji: '🥈', className: 'bg-gradient-to-br from-cyan-500 to-blue-400 shadow-lg shadow-cyan-500/50', border: 'border-cyan-500/40' };
  if (rank === 3) return { emoji: '🥉', className: 'bg-gradient-to-br from-purple-500 to-pink-400 shadow-lg shadow-purple-500/50', border: 'border-purple-500/30' };
  return { emoji: `#${rank}`, className: 'bg-gradient-to-br from-gray-700 to-gray-600 shadow-sm', border: 'border-cyan-500/20' };
}

export default function Results({ params }: { params: Promise<{ competitionId: string }> }) {
  const { competitionId } = use(params);
  const [realResults, setRealResults] = useState<any[]>([]);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [totalJudges, setTotalJudges] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [prizePoolPOL, setPrizePoolPOL] = useState(0);
  const [numWinners, setNumWinners] = useState(3);
  const [competitionTitle, setCompetitionTitle] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/votes/results/${competitionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setRealResults(data.results ?? []);
        setTotalVotesCast(data.totalVotesCast ?? 0);
        setTotalJudges(data.totalJudges ?? 0);
        setTotalSubmissions(data.totalSubmissions ?? 0);
        setNumWinners(data.numWinners ?? 3);
        setCompetitionTitle(data.competitionTitle ?? '');
        setTxHash(data.txHash ?? null);
        // Use prizePoolPOL (human-readable) if available, else try parsing prizePool
        if (data.prizePoolPOL) {
          setPrizePoolPOL(Number(data.prizePoolPOL));
        } else if (data.prizePool) {
          // prizePool is stored in wei — convert to POL (10^18)
          const wei = BigInt(data.prizePool);
          setPrizePoolPOL(Number(wei) / 1e18);
        }
      })
      .catch(() => setError('Failed to load results'))
      .finally(() => setResultsLoading(false));
  }, [competitionId]);

  const splits = SPLITS[numWinners] || SPLITS[3];

  // Build winners array with actual prize amounts, capped to numWinners
  const winners = realResults.slice(0, numWinners).map((r, idx) => ({
    rank: idx + 1,
    projectName: r.projectTitle,
    teamName: r.teamName,
    teamAddress: r.submittedBy
      ? `${r.submittedBy.slice(0, 6)}…${r.submittedBy.slice(-4)}`
      : r.teamName,
    votes: r.voteCount,
    averageScore: r.averageScore,
    totalScore: r.totalScore,
    prizeAmount: splits[idx] ? (prizePoolPOL * splits[idx].pct) / 100 : 0,
    prizeLabel: splits[idx]?.label ?? `#${idx + 1}`,
    pct: splits[idx]?.pct ?? 0,
    repoUrl: r.repoUrl,
    demoUrl: r.demoUrl,
  }));

  const totalPrizeDistributed = prizePoolPOL.toFixed(2);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        {/* Back button */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 max-w-4xl mx-auto w-full text-left">
          <Link
            href={`/competition/${competitionId}`}
            className="inline-flex items-center gap-2.5 text-sm font-bold text-cyan-300 transition-all duration-300 group px-6 py-2.5 border border-cyan-500/40 rounded-xl bg-cyan-500/10 hover:border-cyan-500 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] shadow-sm"
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* Hero Section */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto text-center">
            <Zap className="w-16 h-16 text-cyan-300 mx-auto mb-4" />
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-lime-300 to-cyan-300 bg-clip-text text-transparent">
                Results Announced!
              </span>
            </h1>
            {competitionTitle && (
              <p className="text-2xl text-gray-300 font-semibold mb-2">{competitionTitle}</p>
            )}
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Voting has concluded. Winners have been determined through our trustless ZK voting protocol.
            </p>
          </div>
        </section>

        {/* Prize Released Banner */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto glass-card p-6 border-lime-400/20 bg-lime-400/5 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-lime-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-lime-300 mb-1">Prizes Automatically Distributed</h3>
              <p className="text-sm text-gray-400">
                {prizePoolPOL > 0
                  ? `${totalPrizeDistributed} POL has been automatically split and transferred to winners' wallets via smart contract.`
                  : 'All prizes have been automatically transferred to winners\' wallets via smart contract.'}
              </p>
            </div>
            {txHash && (
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-400 underline hover:text-cyan-200 font-mono whitespace-nowrap"
              >
                <Lock className="w-3 h-3" />
                View TX
              </a>
            )}
          </div>
        </section>

        {/* Winners Display */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">

            {resultsLoading ? (
              <div className="flex justify-center py-24">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="glass-card p-12 border-red-500/20 text-center">
                <p className="text-red-400">{error}</p>
              </div>
            ) : winners.length === 0 ? (
              <div className="glass-card p-12 border-cyan-500/20 text-center">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No results available yet.</p>
                <p className="text-gray-500 text-sm mt-2">Results will appear once votes have been cast and the voting period has ended.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {winners.map((winner, index) => {
                  const badge = getRankBadge(winner.rank);
                  return (
                    <div
                      key={winner.rank}
                      className={`glass-card p-8 border transition-all duration-300 group hover:border-opacity-100 ${badge.border} ${winner.rank === 1 ? 'lg:scale-[1.02]' : ''} animate-float-up`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="flex items-start gap-6 mb-6">
                        {/* Rank Badge */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-black ${badge.className}`}>
                            {badge.emoji}
                          </div>
                        </div>

                        {/* Winner Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300 truncate">
                            {winner.projectName}
                          </h3>
                          <p className="text-gray-400 mb-3">Team: <span className="text-gray-300 font-medium">{winner.teamName || winner.teamAddress}</span></p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="badge-primary">{winner.votes} votes</span>
                            <span className="px-2 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs">
                              Avg score: {winner.averageScore}/10
                            </span>
                            {winner.repoUrl && (
                              <a href={winner.repoUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 underline text-xs">
                                Repo <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {winner.demoUrl && (
                              <a href={winner.demoUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-lime-400 hover:text-lime-200 underline text-xs">
                                Demo <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Prize Info */}
                        {prizePoolPOL > 0 && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-3xl font-bold text-lime-300 mb-1">
                              {winner.prizeAmount.toFixed(2)} POL
                            </div>
                            <div className="text-xs text-gray-500 mb-1">{winner.pct}% of pool</div>
                            <div className="flex items-center gap-1 text-sm text-green-400 justify-end">
                              <CheckCircle className="w-4 h-4" />
                              Released
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Wallet & TX info */}
                      <div className="pt-4 border-t border-cyan-500/10">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Winner Wallet</div>
                            <div className="text-sm font-mono text-cyan-300 truncate">
                              {winner.teamAddress}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Prize Split</div>
                            <div className="text-sm font-mono text-purple-300">
                              {winner.prizeLabel} — {winner.pct}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Final Stats */}
            {!resultsLoading && !error && (
              <div className="mt-12 glass-card p-8 border-cyan-500/20">
                <h2 className="text-2xl font-bold text-white mb-6">Final Statistics</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                    <div className="text-sm text-gray-400 mb-1">Total Prize Distributed</div>
                    <div className="text-2xl font-bold text-cyan-300">
                      {prizePoolPOL > 0 ? `${totalPrizeDistributed} POL` : '—'}
                    </div>
                  </div>
                  <div className="p-4 bg-black/30 rounded-lg border border-purple-500/10">
                    <div className="text-sm text-gray-400 mb-1">Total Votes Cast</div>
                    <div className="text-2xl font-bold text-purple-300">{totalVotesCast.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-black/30 rounded-lg border border-lime-400/10">
                    <div className="text-sm text-gray-400 mb-1">Total Judges</div>
                    <div className="text-2xl font-bold text-lime-300">{totalJudges}</div>
                  </div>
                  <div className="p-4 bg-black/30 rounded-lg border border-orange-500/10">
                    <div className="text-sm text-gray-400 mb-1">Total Submissions</div>
                    <div className="text-2xl font-bold text-orange-300">{totalSubmissions}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Transparency Info */}
            <div className="mt-8 glass-card p-8 border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Transparent &amp; Verifiable</h3>
              <p className="text-gray-400 mb-6">
                All voting commitments, judge identities, and prize distributions are verifiable on-chain. Any participant can verify the integrity of this competition.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/transparency-explorer?competition=${competitionId}`}
                  className="btn-ghost-neon flex items-center justify-center gap-2"
                >
                  View Transparency Details
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link href="/explore" className="btn-neon-cyan flex items-center justify-center gap-2">
                  Explore More Competitions
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
