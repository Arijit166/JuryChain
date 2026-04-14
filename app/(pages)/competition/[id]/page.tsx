'use client';

import { useState, useEffect, use } from 'react';
import { Navbar } from '@/components/layout/navbar';
import ApplyModal from '@/components/ApplyModal';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Users, Trophy, Lock, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

interface Competition {
  _id: string;
  title: string;
  description: string;
  prizePool: string;
  numWinners: number;
  startDate: string;
  submissionDeadline: string;
  votingDeadline: string;
  judges: Array<{ type: 'wallet' | 'email'; value: string }>;
  judgeMerkleRoot: string;
  isPublic: boolean;
  applyDeadline: string;
  pptRequired: boolean;
  category: string;
  venue: string;
  teamSize: number;
  sponsorWallet: string;
  txHash: string | null;
  contractCompetitionId: number | null;
  status: string;
}

const SPLITS: Record<number, { label: string; pct: number }[]> = {
  1: [{ label: '1st Place', pct: 100 }],
  3: [{ label: '1st Place', pct: 50 }, { label: '2nd Place', pct: 30 }, { label: '3rd Place', pct: 20 }],
  5: [{ label: '1st Place', pct: 45 }, { label: '2nd Place', pct: 30 }, { label: '3rd Place', pct: 15 }, { label: '4th Place', pct: 5 }, { label: '5th Place', pct: 5 }],
  10: [{ label: '1st', pct: 30 }, { label: '2nd', pct: 20 }, { label: '3rd', pct: 15 }, { label: '4th', pct: 10 }, { label: '5th', pct: 7 }, { label: '6th', pct: 7 }, { label: '7th', pct: 3 }, { label: '8th', pct: 3 }, { label: '9th', pct: 2.5 }, { label: '10th', pct: 2.5 }],
};

function getPhase(comp: Competition): 'upcoming' | 'submissions' | 'voting' | 'ended' {
  const now = Date.now();
  if (now < new Date(comp.startDate).getTime()) return 'upcoming';
  if (now <= new Date(comp.submissionDeadline).getTime()) return 'submissions';
  if (now <= new Date(comp.votingDeadline).getTime()) return 'voting';
  return 'ended';
}

export default function CompetitionDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'voting'>('overview');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userInfo } = useAuth();
  const [showApply, setShowApply] = useState(false);
  const [myApplication, setMyApplication] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCompetition(data.competition);
      })
      .catch(() => setError('Failed to load competition'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!userInfo?.walletAddress || !competition) return;
    setAppLoading(true);
    fetch(`/api/applications/status?competitionId=${competition._id}&wallet=${userInfo.walletAddress}`)
      .then(r => r.json())
      .then(d => setMyApplication(d.application))
      .finally(() => setAppLoading(false));
  }, [userInfo?.walletAddress, competition]);

  if (loading) return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    </ProtectedRoute>
  );

  if (error || !competition) return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-400">{error || 'Competition not found'}</p>
      </main>
    </ProtectedRoute>
  );

  const phase = getPhase(competition);
  const splits = SPLITS[competition.numWinners] || SPLITS[3];
  const prizeNum = parseFloat(competition.prizePool);

  const phaseColor = {
    upcoming: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
    submissions: 'bg-lime-400/20 border-lime-400/50 text-lime-300',
    voting: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
    ended: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
  }[phase];

  const phaseLabel = {
    upcoming: 'Upcoming',
    submissions: 'Accepting Submissions',
    voting: 'Voting Phase',
    ended: 'Ended',
  }[phase];

  const isOrganizer = userInfo?.walletAddress?.toLowerCase() === competition?.sponsorWallet?.toLowerCase();
  const isJudge = competition?.judges.some(j =>
    (j.type === 'wallet' && j.value.toLowerCase() === userInfo?.walletAddress?.toLowerCase()) ||
    (j.type === 'email' && !!userInfo?.email && j.value.toLowerCase() === userInfo.email.toLowerCase())
  );
  const router = useRouter();
  const now = new Date();
  const votingOpen =
    now >= new Date(competition.submissionDeadline) &&
    now <= new Date(competition.votingDeadline);
  const applyOpen = new Date() < new Date(competition.applyDeadline);
  const canApply = !isOrganizer && !isJudge && applyOpen;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        {/* Back button */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 max-w-4xl mx-auto w-full text-left">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2.5 text-sm font-bold text-cyan-300 transition-all duration-300 group px-6 py-2.5 border border-cyan-500/40 rounded-xl bg-cyan-500/10 hover:border-cyan-500 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] shadow-sm"
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* Hero */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${phaseColor}`}>
                {phaseLabel}
              </span>
              {competition.isPublic
                ? <span className="badge-primary">Public</span>
                : <span className="badge-secondary">Private</span>}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                {competition.title}
              </span>
            </h1>
            <p className="text-base text-gray-400 max-w-2xl mx-auto">{competition.description}</p>
          </div>
        </section>

        {/* Tabs */}
        <div className="sticky top-16 z-40 border-b border-cyan-500/10 bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center gap-2">
              {(['overview', 'timeline', 'voting'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-6 font-semibold text-sm transition-all duration-300 border-b-2 ${activeTab === tab
                    ? 'border-cyan-500 text-cyan-300'
                    : 'border-transparent text-gray-500 hover:text-cyan-400'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">

            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                  {/* Rules */}
                  <div className="glass-card p-8 border-cyan-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4">Competition Rules</h2>
                    <ul className="space-y-3 text-gray-400">
                      <li className="flex gap-3"><span className="text-cyan-300 font-bold">•</span><span>Maximum team size: {competition.teamSize} member{competition.teamSize > 1 ? 's' : ''}</span></li>
                      {competition.pptRequired && (
                        <li className="flex gap-3"><span className="text-cyan-300 font-bold">•</span><span>Each team must submit a PPT presentation</span></li>
                      )}
                      <li className="flex gap-3"><span className="text-cyan-300 font-bold">•</span><span>Applications close: {new Date(competition.applyDeadline).toLocaleString()}</span></li>
                      <li className="flex gap-3"><span className="text-cyan-300 font-bold">•</span><span>Submissions close: {new Date(competition.submissionDeadline).toLocaleString()}</span></li>
                      <li className="flex gap-3"><span className="text-cyan-300 font-bold">•</span><span>Voting closes: {new Date(competition.votingDeadline).toLocaleString()}</span></li>
                      <li className="flex gap-3"><span className="text-cyan-300 font-bold">•</span><span>{competition.isPublic ? 'Open to all participants' : 'Invite-only competition'}</span></li>
                      <li className="flex gap-3"><span className="text-cyan-300 font-bold">•</span><span>Prize distribution is automatic via smart contract</span></li>
                    </ul>
                  </div>

                  {/* Venue */}
                  <div className="glass-card p-8 border-cyan-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-cyan-300" /> Venue
                    </h2>
                    <p className="text-gray-400">{competition.venue}</p>
                  </div>

                  {/* Prize Distribution */}
                  <div className="glass-card p-8 border-purple-500/20">
                    <h2 className="text-2xl font-bold text-white mb-6">Prize Distribution</h2>
                    <div className="space-y-4">
                      {splits.map((s, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-semibold">{s.label}</span>
                            <span className="text-cyan-300 font-bold">
                              {((prizeNum * s.pct) / 100).toFixed(2)} POL <span className="text-gray-500 text-xs">({s.pct}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${s.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Prize */}
                  <div className="glass-card p-6 border-lime-400/20">
                    <div className="text-sm text-gray-400 mb-2">Total Prize Pool</div>
                    <div className="text-4xl font-bold text-lime-300 mb-1">{competition.prizePool} POL</div>
                    <div className="flex items-center gap-2 text-sm text-green-400 mb-4">
                      <Lock className="w-4 h-4" />
                      <span>Escrowed on Polygon</span>
                    </div>
                    {competition.txHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${competition.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 underline hover:text-cyan-200 block mb-4 font-mono truncate"
                      >
                        {competition.txHash.slice(0, 16)}...{competition.txHash.slice(-8)}
                      </a>
                    )}
                    {/* View Results — always shown for everyone when voting ended */}
                    {phase === 'ended' && (
                      <Link
                        href={`/results/${competition._id}`}
                        className="btn-neon-lime w-full text-center block text-sm py-2 font-bold"
                      >
                        🏆 View Results
                      </Link>
                    )}

                    {!isOrganizer && !isJudge && phase !== 'ended' && (
                      appLoading ? (
                        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : myApplication ? (
                        <div className="space-y-2">
                          {/* Status badge */}
                          <div className={`w-full py-2 px-4 rounded-lg text-center text-sm font-semibold border ${myApplication.status === 'accepted' ? 'bg-lime-400/20 border-lime-400/50 text-lime-300' :
                            myApplication.status === 'rejected' ? 'bg-red-400/20 border-red-400/50 text-red-300' :
                              'bg-gray-500/20 border-gray-500/50 text-gray-300'
                            }`}>
                            {myApplication.status === 'accepted' ? '✓ Application Approved' :
                              myApplication.status === 'rejected' ? '✗ Application Rejected' :
                                '⏳ Application Pending'}
                          </div>

                          {/* Submit project / ended — only for accepted teams */}
                          {myApplication.status === 'accepted' && (() => {
                            const now = Date.now();
                            const start = new Date(competition.startDate).getTime();
                            const subDeadline = new Date(competition.submissionDeadline).getTime();
                            if (now < start) {
                              return (
                                <div className="w-full py-2 px-4 rounded-lg text-center text-xs text-gray-400 border border-gray-700">
                                  Project submission opens on {new Date(competition.startDate).toLocaleDateString()}
                                </div>
                              );
                            }
                            if (now >= start && now <= subDeadline) {
                              return (
                                <Link
                                  href={`/submit/${competition._id}`}
                                  className="btn-neon-lime w-full text-center block text-sm py-2"
                                >
                                  Submit Project
                                </Link>
                              );
                            }
                            return (
                              <div className="w-full py-2 px-4 rounded-lg text-center text-sm font-semibold border bg-gray-500/20 border-gray-500/50 text-gray-400">
                                Hackathon Ended
                              </div>
                            );
                          })()}
                        </div>
                      ) : applyOpen ? (
                        <button onClick={() => setShowApply(true)} className="btn-neon-lime w-full text-center block">
                          Apply Now
                        </button>
                      ) : (
                        <div className="w-full py-2 px-4 rounded-lg text-center text-sm font-semibold border bg-gray-500/20 border-gray-500/50 text-gray-400">
                          Applications Closed
                        </div>
                      )
                    )}
                  </div>

                  {/* Stats */}
                  <div className="glass-card p-6 border-cyan-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-300" />
                      <div>
                        <div className="text-sm text-gray-400">Judges</div>
                        <div className="text-2xl font-bold text-white">{competition.judges.length}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-lime-300" />
                      <div>
                        <div className="text-sm text-gray-400">Winners</div>
                        <div className="text-2xl font-bold text-white">{competition.numWinners}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-cyan-300" />
                      <div>
                        <div className="text-sm text-gray-400">Starts</div>
                        <div className="text-sm font-bold text-white">{new Date(competition.startDate).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-cyan-300" />
                      <div>
                        <div className="text-sm text-gray-400">Submit By</div>
                        <div className="text-sm font-bold text-white">{new Date(competition.submissionDeadline).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Judges */}
                  <div className="glass-card p-6 border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-3">Judges ({competition.judges.length})</h3>
                    <div className="space-y-2">
                      {competition.judges.map((j, idx) => (
                        <div key={idx} className="p-2 bg-black/30 rounded border border-purple-500/10">
                          <div className="text-xs text-gray-500 mb-0.5">{j.type === 'wallet' ? 'Wallet' : 'Email'}</div>
                          <div className="text-xs text-gray-300 font-mono truncate">{j.value}</div>
                        </div>
                      ))}
                    </div>
                    {isJudge && votingOpen && (
                      <button
                        onClick={() => router.push(`/vote/${competition._id}`)}
                        className="btn-neon-purple w-full text-center text-sm py-2 mt-4 flex items-center justify-center gap-2"
                      >
                        🗳️ Vote Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="max-w-2xl">
                <div className="space-y-6">
                  {[
                    { phase: 'Competition Start', date: competition.startDate, done: Date.now() >= new Date(competition.startDate).getTime(), desc: 'Competition opens for participants' },
                    { phase: 'Submission Deadline', date: competition.submissionDeadline, done: Date.now() >= new Date(competition.submissionDeadline).getTime(), desc: 'Last date to submit your project' },
                    { phase: 'Voting Deadline', date: competition.votingDeadline, done: Date.now() >= new Date(competition.votingDeadline).getTime(), desc: 'Judges complete their voting' },
                    { phase: 'Prize Distribution', date: competition.votingDeadline, done: false, desc: 'Winners receive prizes automatically via smart contract' },
                  ].map((item, idx) => (
                    <div key={idx} className="glass-card p-6 border-cyan-500/20 flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${item.done ? 'bg-cyan-500' : 'bg-gray-600'}`} />
                        {idx < 3 && <div className="w-1 h-12 bg-gradient-to-b from-cyan-500/50 to-gray-600/50 my-2" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{item.phase}</h3>
                        <p className="text-sm text-gray-400 mb-2">{item.desc}</p>
                        <div className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'voting' && (
              <div className="max-w-2xl">
                <div className="glass-card p-8 border-cyan-500/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Voting Info</h2>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                      <div className="text-sm text-gray-400 mb-1">Total Judges</div>
                      <div className="text-2xl font-bold text-cyan-300">{competition.judges.length}</div>
                    </div>
                    <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                      <div className="text-sm text-gray-400 mb-1">Merkle Root</div>
                      <div className="text-xs text-purple-300 font-mono break-all">{competition.judgeMerkleRoot?.slice(0, 18)}...</div>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 bg-black/30 rounded-lg border border-cyan-500/10">
                    <div>
                      <h3 className="text-white font-semibold mb-1">Voting Phase</h3>
                      <p className="text-sm text-gray-400">
                        Opens: {new Date(competition.submissionDeadline).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        Closes: {new Date(competition.votingDeadline).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Prize Distribution</h3>
                      <p className="text-sm text-gray-400">
                        Automatic after voting closes. Smart contract distributes {competition.prizePool} POL to {competition.numWinners} winner{competition.numWinners > 1 ? 's' : ''}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        {showApply && competition && (
          <ApplyModal
            competitionId={competition._id}
            teamSize={competition.teamSize}
            pptRequired={competition.pptRequired}
            onClose={() => setShowApply(false)}
            onSuccess={() => { setShowApply(false); setMyApplication({ status: 'pending' }); }}
          />
        )}
      </main>
    </ProtectedRoute >
  );
}