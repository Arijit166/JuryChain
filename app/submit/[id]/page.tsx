'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    Upload, Github, Globe, Link2, Plus, X, CheckCircle,
    Clock, AlertTriangle, FileText, Loader2, ExternalLink,
    Trophy, Users, Calendar
} from 'lucide-react';

interface Competition {
    _id: string;
    title: string;
    startDate: string;
    submissionDeadline: string;
    votingDeadline: string;
    prizePoolPOL: number;
    numWinners: number;
    teamSize: number;
}

interface Application {
    _id: string;
    teamName: string;
    teamCode: string;
    members: { name: string; walletAddress: string; isLeader: boolean }[];
    status: string;
}

interface Submission {
    _id: string;
    projectTitle: string;
    description: string;
    repoUrl: string;
    demoUrl: string;
    ipfsHash: string | null;
    fileUrl: string | null;
    additionalLinks: string[];
    submittedBy: string;
    updatedAt: string;
}

type PageState = 'loading' | 'not_accepted' | 'not_started' | 'open' | 'ended';

export default function SubmitProjectPage() {
    const { id: competitionId } = useParams<{ id: string }>();
    const { userInfo } = useAuth();
    const router = useRouter();

    const [pageState, setPageState] = useState<PageState>('loading');
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [application, setApplication] = useState<Application | null>(null);
    const [existing, setExisting] = useState<Submission | null>(null);
    const [timeLeft, setTimeLeft] = useState('');

    const [form, setForm] = useState({
        projectTitle: '',
        description: '',
        repoUrl: '',
        demoUrl: '',
        additionalLinks: [''],
    });

    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState('');  // manual URL fallback
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [error, setError] = useState('');

    const wallet = userInfo?.walletAddress?.toLowerCase() || '';

    // Fetch competition + application + existing submission
    const loadData = useCallback(async () => {
        if (!wallet || !competitionId) return;
        try {
            const res = await fetch(`/api/submissions/my?competitionId=${competitionId}&wallet=${wallet}`);
            const data = await res.json();

            if (!data.competition) { setPageState('not_accepted'); return; }
            setCompetition(data.competition);

            const now = new Date();
            const start = new Date(data.competition.startDate);
            const deadline = new Date(data.competition.submissionDeadline);

            if (!data.application) { setPageState('not_accepted'); return; }
            setApplication(data.application);

            if (now < start) { setPageState('not_started'); return; }
            if (now > deadline) { setPageState('ended'); return; }

            setPageState('open');

            if (data.submission) {
                setExisting(data.submission);
                setForm({
                    projectTitle: data.submission.projectTitle,
                    description: data.submission.description,
                    repoUrl: data.submission.repoUrl || '',
                    demoUrl: data.submission.demoUrl || '',
                    additionalLinks: data.submission.additionalLinks?.length ? data.submission.additionalLinks : [''],
                });
                setFileUrl(data.submission.fileUrl || '');
                setSavedAt(data.submission.updatedAt);
            }
        } catch {
            setPageState('not_accepted');
        }
    }, [wallet, competitionId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Countdown timer
    useEffect(() => {
        if (!competition || pageState !== 'open') return;
        const deadline = new Date(competition.submissionDeadline);
        const tick = () => {
            const diff = deadline.getTime() - Date.now();
            if (diff <= 0) { setPageState('ended'); setTimeLeft(''); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [competition, pageState]);

    // Upload file to IPFS via Pinata
    const handleFileUpload = async (): Promise<{ ipfsHash: string | null; fileUrl: string }> => {
        if (!file) return { ipfsHash: null, fileUrl };
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/submissions/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFileUrl(data.fileUrl);
            setFile(null);
            return { ipfsHash: data.ipfsHash, fileUrl: data.fileUrl };
        } catch (e: any) {
            setError(`Upload failed: ${e.message}. You can paste a direct URL instead.`);
            return { ipfsHash: null, fileUrl };
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        setError('');
        if (!form.projectTitle.trim() || !form.description.trim()) {
            setError('Project title and description are required.');
            return;
        }
        setSaving(true);
        try {
            let ipfsHash = existing?.ipfsHash || null;
            let resolvedFileUrl = fileUrl;

            if (file) {
                const uploaded = await handleFileUpload();
                ipfsHash = uploaded.ipfsHash;
                resolvedFileUrl = uploaded.fileUrl;
            }

            const links = form.additionalLinks.filter(l => l.trim());
            const res = await fetch('/api/submissions/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competitionId,
                    walletAddress: userInfo?.walletAddress,
                    projectTitle: form.projectTitle,
                    description: form.description,
                    repoUrl: form.repoUrl,
                    demoUrl: form.demoUrl,
                    ipfsHash,
                    fileUrl: resolvedFileUrl || null,
                    additionalLinks: links,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setExisting(data.submission);
            setSavedAt(data.submission.updatedAt);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const addLink = () => setForm(p => ({ ...p, additionalLinks: [...p.additionalLinks, ''] }));
    const removeLink = (i: number) => setForm(p => ({ ...p, additionalLinks: p.additionalLinks.filter((_, idx) => idx !== i) }));
    const updateLink = (i: number, val: string) => setForm(p => ({
        ...p,
        additionalLinks: p.additionalLinks.map((l, idx) => idx === i ? val : l),
    }));

    const inputCls = "w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300";
    const labelCls = "block text-sm font-semibold text-white mb-2";

    // ── State renders ────────────────────────────────────────────────────────

    if (pageState === 'loading') {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-background text-foreground">
                    <Navbar />
                    <div className="flex justify-center items-center min-h-[60vh]">
                        <Loader2 className="w-10 h-10 border-cyan-500 animate-spin text-cyan-400" />
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (pageState === 'not_accepted') {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-background text-foreground">
                    <Navbar />
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                        <AlertTriangle className="w-16 h-16 text-amber-400" />
                        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
                        <p className="text-gray-400 max-w-md">You don't have an accepted application for this competition. Only approved participants can submit projects.</p>
                        <button onClick={() => router.back()} className="btn-neon-cyan px-6 py-2 mt-2">Go Back</button>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (pageState === 'not_started') {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-background text-foreground">
                    <Navbar />
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                        <Clock className="w-16 h-16 text-cyan-400" />
                        <h1 className="text-2xl font-bold text-white">Hackathon Hasn't Started Yet</h1>
                        <p className="text-gray-400 max-w-md">
                            Submissions open on <span className="text-cyan-300 font-semibold">{new Date(competition!.startDate).toLocaleString()}</span>.
                        </p>
                        <button onClick={() => router.back()} className="btn-neon-cyan px-6 py-2 mt-2">Go Back</button>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (pageState === 'ended') {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-background text-foreground">
                    <Navbar />
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Trophy className="w-10 h-10 text-purple-300" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Hackathon Ended</h1>
                        <p className="text-gray-400 max-w-md">The submission window has closed. Results will be announced after the judging phase.</p>
                        {existing && (
                            <div className="p-4 bg-lime-400/10 border border-lime-400/30 rounded-lg max-w-sm w-full">
                                <div className="text-lime-300 font-semibold flex items-center gap-2 justify-center">
                                    <CheckCircle className="w-4 h-4" /> Submission Received
                                </div>
                                <div className="text-white font-bold mt-1">{existing.projectTitle}</div>
                                <div className="text-xs text-gray-400 mt-0.5">Last updated: {new Date(existing.updatedAt).toLocaleString()}</div>
                            </div>
                        )}
                        <button onClick={() => router.push(`/competition/${competitionId}`)} className="btn-neon-cyan px-6 py-2">
                            View Competition
                        </button>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    // ── Main submit form (pageState === 'open') ──────────────────────────────

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-background">
                <Navbar />

                {/* Header */}
                <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-3">
                            <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                                Submit Your Project
                            </span>
                        </h1>
                        <p className="text-base text-gray-400 max-w-2xl mx-auto mb-4">{competition?.title || 'Share your innovation with our judges'}</p>

                        {/* Info strip */}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400 justify-center">
                            <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-purple-300" />
                                {application?.teamName}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-lime-300" />
                                {competition?.prizePoolPOL} POL · {competition?.numWinners} Winners
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-cyan-300" />
                                Deadline: {new Date(competition!.submissionDeadline).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="py-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-3 gap-8">
                            
                            {/* Form Column */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Countdown + saved status */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    {timeLeft && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                            <Clock className="w-4 h-4 text-amber-300" />
                                            <span className="text-amber-300 font-mono font-semibold text-sm">{timeLeft} remaining</span>
                                        </div>
                                    )}
                                    {savedAt && (
                                        <div className="flex items-center gap-2 text-xs text-lime-400">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Last saved: {new Date(savedAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>
                                )}

                                {/* Team members notice */}
                                <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-xs text-cyan-400">
                                    Any member of <span className="font-semibold text-cyan-300">{application?.teamName}</span> can submit or update this project until the deadline.
                                </div>

                                <div className="space-y-6">
                                    {/* Project title */}
                                    <div>
                                        <label className={labelCls}>Project Title *</label>
                                        <input
                                            className={inputCls}
                                            placeholder="Give your project a name"
                                            value={form.projectTitle}
                                            onChange={e => setForm(p => ({ ...p, projectTitle: e.target.value }))}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className={labelCls}>Project Description *</label>
                                        <textarea
                                            className={`${inputCls} min-h-[120px] resize-y`}
                                            placeholder="Describe what you built, the problem it solves, and how it works..."
                                            value={form.description}
                                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        />
                                    </div>

                                    {/* Repo */}
                                    <div>
                                        <label className={labelCls}>GitHub Repository Link *</label>
                                        <input
                                            className={inputCls}
                                            placeholder="https://github.com/username/project"
                                            value={form.repoUrl}
                                            onChange={e => setForm(p => ({ ...p, repoUrl: e.target.value }))}
                                        />
                                    </div>

                                    {/* Demo */}
                                    <div>
                                        <label className={labelCls}>Demo or Live Link</label>
                                        <input
                                            className={inputCls}
                                            placeholder="https://demo.example.com"
                                            value={form.demoUrl}
                                            onChange={e => setForm(p => ({ ...p, demoUrl: e.target.value }))}
                                        />
                                    </div>

                                    {/* File upload (IPFS) */}
                                    <div>
                                        <label className={labelCls}>Additional Files (Optional)</label>
                                        <div className="space-y-2">
                                            <div className="relative border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors duration-300 cursor-pointer bg-black/20">
                                                <Upload className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400 mb-1">Drag and drop files or click to browse</p>
                                                <p className="text-xs text-gray-500">PDF, ZIP, or image files supported</p>
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept=".pdf,.pptx,.ppt,.zip,.png,.jpg,.mp4"
                                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                                />
                                            </div>
                                            {file && (
                                                <p className="text-cyan-300 text-sm font-medium mt-2">{file.name}</p>
                                            )}
                                            {uploading && (
                                                <div className="flex items-center gap-2 text-xs text-cyan-400 mt-2">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading to IPFS...
                                                </div>
                                            )}
                                            {/* Existing file */}
                                            {(fileUrl || existing?.fileUrl) && !file && (
                                                <div className="mt-2">
                                                    <a
                                                        href={fileUrl || existing?.fileUrl || ''}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-xs text-lime-400 hover:underline"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        {existing?.ipfsHash ? `IPFS File: ${existing.ipfsHash.slice(0, 16)}...` : 'View uploaded file'}
                                                    </a>
                                                </div>
                                            )}
                                            {/* Manual URL fallback */}
                                            <div className="mt-3">
                                                <input
                                                    className={inputCls}
                                                    placeholder="Or paste a direct file URL (Google Drive, Slides, etc.)"
                                                    value={fileUrl}
                                                    onChange={e => { setFileUrl(e.target.value); setFile(null); }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional links */}
                                    <div>
                                        <label className={labelCls}>Additional Links</label>
                                        <div className="space-y-2">
                                            {form.additionalLinks.map((link, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        className={inputCls}
                                                        placeholder="https://..."
                                                        value={link}
                                                        onChange={e => updateLink(i, e.target.value)}
                                                    />
                                                    {form.additionalLinks.length > 1 && (
                                                        <button onClick={() => removeLink(i)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={addLink} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-200 transition-colors">
                                                <Plus className="w-3.5 h-3.5" /> Add another link
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit button */}
                                    <div className="space-y-2 mt-6">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={saving || uploading || !form.projectTitle.trim() || !form.description.trim()}
                                            className="btn-neon-cyan w-full py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {saving ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                                            ) : existing ? (
                                                'Update Submission'
                                            ) : (
                                                'Submit Project'
                                            )}
                                        </button>
                                        {existing && (
                                            <p className="text-xs text-gray-500 text-center">
                                                You can update your submission any time before the deadline.
                                            </p>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Info Sidebar */}
                            <div className="space-y-6">
                                {/* Info Card */}
                                <div className="glass-card p-6 border-cyan-500/20">
                                    <h3 className="text-lg font-bold text-white mb-4">Submission Info</h3>
                                    <div className="space-y-4 text-sm text-gray-400">
                                        <div className="flex gap-3">
                                            <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                                            <p>Your submission will be stored on IPFS</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                                            <p>Submission hash recorded on blockchain</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                                            <p>Anonymous to judges during voting</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                                            <p>Can edit before deadline</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div className="glass-card p-6 border-purple-500/20">
                                    <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li className="flex gap-2">
                                            <span className="text-purple-300">•</span>
                                            <span>Working prototype or demo</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-purple-300">•</span>
                                            <span>Public GitHub repository</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-purple-300">•</span>
                                            <span>Clear documentation</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-purple-300">•</span>
                                            <span>Team info (max {competition?.teamSize || 5} members)</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Warning */}
                                <div className="glass-card p-6 border-orange-500/20 bg-orange-500/5">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-white mb-1">Deadline</h4>
                                            <p className="text-sm text-gray-400">
                                                Submissions close on {competition ? new Date(competition.submissionDeadline).toLocaleString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </ProtectedRoute>
    );
}