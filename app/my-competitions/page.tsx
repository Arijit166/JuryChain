'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Users, Check, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Member {
    name: string; email: string; walletAddress: string;
    linkedinUrl: string; githubUrl: string; isLeader: boolean;
}
interface Application {
    _id: string; teamName: string; teamCode: string;
    members: Member[]; pptUrl: string | null;
    status: 'pending' | 'accepted' | 'rejected';
    appliedAt: string | null; lockedAt: string | null;
}
interface Competition {
    _id: string; title: string; prizePool: string;
    status: string; numWinners: number; applyDeadline: string;
    category: string; startDate: string;
}

export default function MyCompetitionsPage() {
    const { userInfo } = useAuth();
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [applications, setApplications] = useState<Record<string, Application[]>>({});
    const [appsLoading, setAppsLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!userInfo?.walletAddress) return;
        fetch(`/api/competitions/my?wallet=${userInfo.walletAddress}`)
            .then(r => r.json())
            .then(d => setCompetitions(d.competitions || []))
            .finally(() => setLoading(false));
    }, [userInfo?.walletAddress]);

    const loadApplications = async (competitionId: string) => {
        if (applications[competitionId]) {
            setExpanded(expanded === competitionId ? null : competitionId);
            return;
        }
        setAppsLoading(competitionId);
        const res = await fetch(`/api/applications/list?competitionId=${competitionId}&wallet=${userInfo?.walletAddress}`);
        const data = await res.json();
        setApplications(prev => ({ ...prev, [competitionId]: data.applications || [] }));
        setExpanded(competitionId);
        setAppsLoading(null);
    };

    const updateStatus = async (applicationId: string, competitionId: string, action: 'accepted' | 'rejected') => {
        await fetch('/api/applications/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, action, wallet: userInfo?.walletAddress }),
        });
        setApplications(prev => ({
            ...prev,
            [competitionId]: prev[competitionId].map(a =>
                a._id === applicationId ? { ...a, status: action } : a
            ),
        }));
    };

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-background">
                <Navbar />
                <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                                My Competitions
                            </span>
                        </h1>
                        <p className="text-gray-400">Competitions you've created and their applicants.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24">
                            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : competitions.length === 0 ? (
                        <div className="glass-card p-12 border-cyan-500/20 text-center">
                            <p className="text-gray-400 mb-4">You haven't created any competitions yet.</p>
                            <Link href="/create-competition" className="btn-neon-cyan inline-flex">Create One</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {competitions.map((comp) => (
                                <div key={comp._id} className="glass-card border-cyan-500/20">
                                    {/* Competition Header */}
                                    <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <h3 className="text-lg font-bold text-white">{comp.title}</h3>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                    {comp.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                                                <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-lime-300" />{comp.prizePool} POL</span>
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-300" />{comp.numWinners} Winners</span>
                                                <span>Apply by: {new Date(comp.applyDeadline).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link href={`/competition/${comp._id}`} className="p-2 text-gray-400 hover:text-cyan-300 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => loadApplications(comp._id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/20 transition-colors text-sm font-semibold"
                                            >
                                                {appsLoading === comp._id
                                                    ? <div className="w-4 h-4 border border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                                    : <>View Applicants {expanded === comp._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* Applications Panel */}
                                    {expanded === comp._id && (
                                        <div className="border-t border-cyan-500/10 p-6">
                                            {(applications[comp._id] || []).length === 0 ? (
                                                <p className="text-gray-500 text-sm text-center py-4">No applications yet.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-sm font-semibold text-white">
                                                            {applications[comp._id].length} Application{applications[comp._id].length !== 1 ? 's' : ''}
                                                        </span>
                                                        <div className="flex gap-3 text-xs text-gray-400">
                                                            <span className="text-lime-300">{applications[comp._id].filter(a => a.status === 'accepted').length} accepted</span>
                                                            <span className="text-red-400">{applications[comp._id].filter(a => a.status === 'rejected').length} rejected</span>
                                                            <span className="text-gray-400">{applications[comp._id].filter(a => a.status === 'pending').length} pending</span>
                                                        </div>
                                                    </div>
                                                    {applications[comp._id].map((app) => (
                                                        <div key={app._id} className="p-4 bg-black/30 rounded-lg border border-purple-500/10">
                                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                        <span className="font-semibold text-white">{app.teamName}</span>
                                                                        <span className="text-xs font-mono text-gray-500">Code: {app.teamCode}</span>
                                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${app.status === 'accepted' ? 'bg-lime-400/20 border-lime-400/50 text-lime-300' :
                                                                                app.status === 'rejected' ? 'bg-red-400/20 border-red-400/50 text-red-300' :
                                                                                    'bg-gray-500/20 border-gray-500/50 text-gray-300'
                                                                            }`}>{app.status}</span>
                                                                        {app.lockedAt && <span className="text-xs text-cyan-400">✓ Submitted</span>}
                                                                    </div>
                                                                    {/* Members */}
                                                                    <div className="space-y-1 mb-2">
                                                                        {app.members.map((m, i) => (
                                                                            <div key={i} className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                                                                                <span className="text-white font-medium">{m.name}</span>
                                                                                {m.isLeader && <span className="text-cyan-400 text-xs">(Leader)</span>}
                                                                                <span>{m.email}</span>
                                                                                <a href={m.githubUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">GitHub</a>
                                                                                <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">LinkedIn</a>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {app.pptUrl && (
                                                                        <a href={app.pptUrl} target="_blank" rel="noopener noreferrer"
                                                                            className="text-xs text-lime-400 underline hover:text-lime-200">
                                                                            View PPT
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {/* Accept / Reject */}
                                                                {app.status === 'pending' && (
                                                                    <div className="flex gap-2 shrink-0">
                                                                        <button onClick={() => updateStatus(app._id, comp._id, 'accepted')}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-lime-400/20 border border-lime-400/50 rounded text-lime-300 hover:bg-lime-400/30 text-xs font-semibold transition-colors">
                                                                            <Check className="w-3 h-3" /> Accept
                                                                        </button>
                                                                        <button onClick={() => updateStatus(app._id, comp._id, 'rejected')}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-400/20 border border-red-400/50 rounded text-red-300 hover:bg-red-400/30 text-xs font-semibold transition-colors">
                                                                            <X className="w-3 h-3" /> Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}