'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Users, Check, X, ExternalLink, FileText, Globe, Github, Link2 } from 'lucide-react';
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
    votingDeadline: string;
}
interface Submission {
    _id: string;
    teamName: string;
    projectTitle: string;
    description: string;
    repoUrl: string;
    demoUrl: string;
    fileUrl: string | null;
    ipfsHash: string | null;
    additionalLinks: string[];
    submittedBy: string;
    updatedAt: string;
}

export default function MyCompetitionsPage() {
    const { userInfo } = useAuth();
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [applications, setApplications] = useState<Record<string, Application[]>>({});
    const [appsLoading, setAppsLoading] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
    const [subsLoading, setSubsLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Record<string, 'applicants' | 'submissions'>>({});

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

    const loadSubmissions = async (competitionId: string) => {
        if (submissions[competitionId]) return; // already loaded
        setSubsLoading(competitionId);
        const res = await fetch(`/api/submissions/list?competitionId=${competitionId}&wallet=${userInfo?.walletAddress}`);
        const data = await res.json();
        setSubmissions(prev => ({ ...prev, [competitionId]: data.submissions || [] }));
        setSubsLoading(null);
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
            <main className="min-h-screen bg-background text-foreground">
                <Navbar />

                {/* Hero */}
                <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
                    <div className="max-w-7xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                                My Competitions
                            </span>
                        </h1>
                        <p className="text-lg text-gray-400">Competitions you've created and their applicants.</p>
                    </div>
                </section>

                <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

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
                                        <div className="flex items-center gap-2">
                                            <Link href={`/competition/${comp._id}`} className="p-2 text-gray-400 hover:text-cyan-300 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            {/* Applicants button */}
                                            <button
                                                onClick={() => {
                                                    const tab = activeTab[comp._id];
                                                    if (expanded === comp._id && tab === 'applicants') {
                                                        setExpanded(null);
                                                    } else {
                                                        setActiveTab(p => ({ ...p, [comp._id]: 'applicants' }));
                                                        loadApplications(comp._id);
                                                        setExpanded(comp._id);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/20 text-sm font-semibold"
                                            >
                                                {appsLoading === comp._id
                                                    ? <div className="w-4 h-4 border border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                                    : <><Users className="w-4 h-4" /> Applicants</>
                                                }
                                            </button>
                                            {/* Submissions button */}
                                            <button
                                                onClick={() => {
                                                    const tab = activeTab[comp._id];
                                                    if (expanded === comp._id && tab === 'submissions') {
                                                        setExpanded(null);
                                                    } else {
                                                        setActiveTab(p => ({ ...p, [comp._id]: 'submissions' }));
                                                        loadSubmissions(comp._id);
                                                        setExpanded(comp._id);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/20 text-sm font-semibold"
                                            >
                                                {subsLoading === comp._id
                                                    ? <div className="w-4 h-4 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                                                    : <><FileText className="w-4 h-4" /> Submissions</>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* Applications Panel */}
                                    {expanded === comp._id && (
                                        <div className="border-t border-cyan-500/10 p-6">
                                            {activeTab[comp._id] === 'submissions' ? (
                                                // ── Submissions Panel ──
                                                (submissions[comp._id] || []).length === 0 ? (
                                                    <p className="text-gray-500 text-sm text-center py-4">No submissions yet.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <span className="text-sm font-semibold text-white block mb-4">
                                                            {submissions[comp._id].length} Submission{submissions[comp._id].length !== 1 ? 's' : ''}
                                                        </span>
                                                        {submissions[comp._id].map((sub) => (
                                                            <div key={sub._id} className="p-4 bg-black/30 rounded-lg border border-purple-500/10 space-y-2">
                                                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                                                    <div>
                                                                        <div className="font-semibold text-white">{sub.projectTitle}</div>
                                                                        <div className="text-xs text-purple-300 mt-0.5">{sub.teamName}</div>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Updated: {new Date(sub.updatedAt).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-gray-400 line-clamp-2">{sub.description}</p>
                                                                <div className="flex flex-wrap gap-3 text-xs">
                                                                    {sub.repoUrl && (
                                                                        <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-cyan-400 hover:underline">
                                                                            <Github className="w-3 h-3" /> GitHub
                                                                        </a>
                                                                    )}
                                                                    {sub.demoUrl && (
                                                                        <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-lime-400 hover:underline">
                                                                            <Globe className="w-3 h-3" /> Demo
                                                                        </a>
                                                                    )}
                                                                    {sub.fileUrl && (
                                                                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-purple-400 hover:underline">
                                                                            <ExternalLink className="w-3 h-3" />
                                                                            {sub.ipfsHash ? 'IPFS File' : 'File'}
                                                                        </a>
                                                                    )}
                                                                    {sub.additionalLinks?.map((l, i) => (
                                                                        <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-gray-400 hover:text-white hover:underline">
                                                                            <Link2 className="w-3 h-3" /> Link {i + 1}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            ) : (
                                                (applications[comp._id] || []).length === 0 ? (
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
                                                                    {app.status === 'pending' &&
                                                                        app.lockedAt &&
                                                                        new Date() < new Date(comp.startDate) && (
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
                                                )
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