'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, Trophy, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Competition {
  _id: string;
  title: string;
  category: string;
  prizePool: string;
  prizePoolPOL: number;
  judges: Array<{ type: string; value: string }>;
  numWinners: number;
  submissionDeadline: string;
  startDate: string;
  votingDeadline: string;
  applyDeadline: string;
  status: string;
  venue: string;
}

function getApplyTimeLabel(comp: Competition): string {
  const diff = new Date(comp.applyDeadline).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Closing soon';
  if (days === 1) return '1 day left to apply';
  return `${days} days left to apply`;
}

export function ActiveCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/competitions/list')
      .then((r) => r.json())
      .then((data) => {
        const all: Competition[] = data.competitions || [];
        const now = Date.now();
        // Only show competitions still in the apply phase
        const applyPhase = all
          .filter((c) => new Date(c.applyDeadline).getTime() > now)
          .slice(0, 6);
        setCompetitions(applyPhase);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Don't render the section at all if there's nothing to show
  if (!loading && competitions.length === 0) return null;

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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Loading competitions…</span>
          </div>
        )}

        {/* Competitions Grid */}
        {!loading && competitions.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((comp, index) => (
              <Link
                key={comp._id}
                href={`/competition/${comp._id}`}
                className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 cursor-pointer transition-all duration-300 animate-float-up block"
                style={{ animationDelay: `${(index % 3) * 100}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300 truncate">
                      {comp.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{comp.venue || comp.category}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20 shrink-0">
                        {comp.category === 'ML' ? 'ML/AI' : comp.category}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded border shrink-0 ml-2 bg-lime-400/20 border-lime-400/50 text-lime-300">
                    Apply Now
                  </span>
                </div>

                {/* Prize Pool */}
                <div className="mb-6">
                  <div className="text-2xl font-bold text-cyan-300 mb-1">
                    {comp.prizePoolPOL ? `${comp.prizePoolPOL} POL` : comp.prizePool}
                  </div>
                  <div className="text-xs text-gray-400">Prize Pool</div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-6 py-4 border-t border-b border-cyan-500/10">
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-purple-300 shrink-0" />
                    <span className="text-gray-400">{comp.judges.length} Judges</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Trophy className="w-4 h-4 text-lime-300 shrink-0" />
                    <span className="text-gray-400">{comp.numWinners} Winners</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
                    <span className="text-gray-400">{getApplyTimeLabel(comp)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-cyan-300 shrink-0" />
                    <span className="text-gray-400">
                      Apply by {new Date(comp.applyDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="w-full py-2 px-4 font-semibold rounded-lg text-center group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300 bg-gradient-to-r from-cyan-500 to-purple-500 text-black">
                  Apply Now
                </div>
              </Link>
            ))}
          </div>
        )}



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
