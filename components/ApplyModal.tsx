'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Users, UserPlus, Crown, Github, Linkedin, Pencil, RefreshCw, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Member {
    name: string;
    email: string;
    walletAddress: string;
    linkedinUrl: string;
    githubUrl: string;
    isLeader: boolean;
}

interface Team {
    _id: string;
    teamName: string;
    teamCode: string;
    members: Member[];
    maxMembers: number;
    pptUrl: string | null;
    lockedAt: string | null;
    status: string;
}

interface Props {
    competitionId: string;
    teamSize: number;
    pptRequired: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Flow = 'loading' | 'choose' | 'create' | 'join' | 'team_ready';

export default function ApplyModal({ competitionId, teamSize, pptRequired, onClose, onSuccess }: Props) {
    const { userInfo } = useAuth();
    const [flow, setFlow] = useState<Flow>('loading');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [team, setTeam] = useState<Team | null>(null);
    const [isEditingTeam, setIsEditingTeam] = useState(false);
    const [isEditingSelf, setIsEditingSelf] = useState(false);
    const [copied, setCopied] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [form, setForm] = useState({
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        linkedinUrl: '',
        githubUrl: '',
        teamName: '',
        pptUrl: '',
        joinCode: '',
    });

    const myWallet = userInfo?.walletAddress?.toLowerCase() || '';
    const myMember = team?.members.find(m => m.walletAddress.toLowerCase() === myWallet);
    const isLeader = myMember?.isLeader ?? false;
    const isLocked = !!team?.lockedAt;

    // On mount: check if user already has a team for this competition
    useEffect(() => {
        if (!myWallet) return;
        fetch(`/api/applications/status?competitionId=${competitionId}&wallet=${myWallet}`)
            .then(r => r.json())
            .then(data => {
                if (data.application) {
                    setTeam(data.application);
                    // pre-fill edit form with their current data
                    const me = data.application.members.find(
                        (m: Member) => m.walletAddress.toLowerCase() === myWallet
                    );
                    if (me) {
                        setForm(p => ({
                            ...p,
                            name: me.name,
                            email: me.email,
                            linkedinUrl: me.linkedinUrl,
                            githubUrl: me.githubUrl,
                        }));
                    }
                    setFlow('team_ready');
                } else {
                    setFlow('choose');
                }
            })
            .catch(() => setFlow('choose'));
    }, [competitionId, myWallet]);

    const refreshTeam = useCallback(async () => {
        if (!team?._id) return;
        setRefreshing(true);
        try {
            const res = await fetch(`/api/applications/team?id=${team._id}`);
            const data = await res.json();
            if (data.application) setTeam(data.application);
        } catch { }
        finally { setRefreshing(false); }
    }, [team?._id]);

    // Poll every 5s while team not locked
    useEffect(() => {
        if (flow !== 'team_ready') return;
        if (isLocked && team?.status !== 'pending') return;
        const interval = setInterval(refreshTeam, 5000);
        return () => clearInterval(interval);
    }, [flow, isLocked, refreshTeam]);

    const validateLinks = () => {
        const gh = form.githubUrl.trim();
        const li = form.linkedinUrl.trim();
        const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9._-]+\/?$/;
        const linkedinRegex = /^(https?:\/\/)?([a-z]+\.)?linkedin\.com\/in\/[a-zA-Z0-9._-]+\/?$/;

        if (!githubRegex.test(gh)) {
            setError('Invalid GitHub Profile URL (should be like github.com/username)');
            return false;
        }
        if (!linkedinRegex.test(li)) {
            setError('Invalid LinkedIn Profile URL (should be like linkedin.com/in/username)');
            return false;
        }
        return true;
    };

    const member = {
        name: form.name,
        email: form.email,
        walletAddress: userInfo?.walletAddress || '',
        linkedinUrl: form.linkedinUrl,
        githubUrl: form.githubUrl,
    };

    const handleCreate = async () => {
        if (!validateLinks()) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/applications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competitionId, teamName: form.teamName,
                    member, pptUrl: pptRequired ? form.pptUrl : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTeam(data.application);
            setFlow('team_ready');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleJoin = async () => {
        if (!validateLinks()) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/applications/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamCode: form.joinCode, member }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTeam(data.application);
            setFlow('team_ready');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    // Leader edits team name / ppt
    const handleSaveTeamEdit = async () => {
        if (!team) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/applications/edit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamCode: team.teamCode,
                    walletAddress: userInfo?.walletAddress,
                    teamName: form.teamName || undefined,
                    pptUrl: form.pptUrl || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTeam(data.application);
            setIsEditingTeam(false);
            setForm(p => ({ ...p, teamName: '', pptUrl: '' }));
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    // Any member edits their own personal details
    const handleSaveSelfEdit = async () => {
        if (!validateLinks()) return;
        if (!team) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/applications/edit-member', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamCode: team.teamCode,
                    walletAddress: userInfo?.walletAddress,
                    name: form.name,
                    email: form.email,
                    linkedinUrl: form.linkedinUrl,
                    githubUrl: form.githubUrl,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTeam(data.application);
            setIsEditingSelf(false);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleSubmitTeam = async () => {
        if (!team) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/applications/submit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamCode: team.teamCode,
                    walletAddress: userInfo?.walletAddress,
                    pptUrl: form.pptUrl || team.pptUrl || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSuccess();
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const copyCode = () => {
        if (!team) return;
        navigator.clipboard.writeText(team.teamCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const inputCls = "w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-card border-cyan-500/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-cyan-500/10">
                    <h2 className="text-xl font-bold text-white">
                        {flow === 'team_ready' && team ? team.teamName : 'Apply to Competition'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>
                    )}

                    {/* Loading */}
                    {flow === 'loading' && (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Choose */}
                    {flow === 'choose' && (
                        <div className="space-y-4">
                            <p className="text-gray-400 text-sm">Choose how you want to participate:</p>
                            <button onClick={() => setFlow('create')}
                                className="w-full p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:border-cyan-500 transition-all text-left group">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-cyan-300" />
                                    <div>
                                        <div className="text-white font-semibold group-hover:text-cyan-300">Create a Team</div>
                                        <div className="text-xs text-gray-400">Start a new team (solo or invite others)</div>
                                    </div>
                                </div>
                            </button>
                            <button onClick={() => setFlow('join')}
                                className="w-full p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:border-purple-500 transition-all text-left group">
                                <div className="flex items-center gap-3">
                                    <UserPlus className="w-5 h-5 text-purple-300" />
                                    <div>
                                        <div className="text-white font-semibold group-hover:text-purple-300">Join a Team</div>
                                        <div className="text-xs text-gray-400">Enter a team code to join an existing team</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Create */}
                    {flow === 'create' && (
                        <div className="space-y-3">
                            <div className="text-sm font-semibold text-cyan-300">Your Details</div>
                            <input className={inputCls} placeholder="Your Name *" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                            <input className={inputCls} placeholder="Your Email *" type="email" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                            <input className={inputCls} placeholder="GitHub Profile URL *" value={form.githubUrl}
                                onChange={e => setForm(p => ({ ...p, githubUrl: e.target.value }))} />
                            <input className={inputCls} placeholder="LinkedIn Profile URL *" value={form.linkedinUrl}
                                onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} />
                            <div className="text-sm font-semibold text-cyan-300 pt-1">Team Details</div>
                            <input className={inputCls} placeholder="Team Name (unique) *" value={form.teamName}
                                onChange={e => setForm(p => ({ ...p, teamName: e.target.value }))} />
                            {pptRequired && (
                                <input className={inputCls} placeholder="PPT Link (Google Slides / Drive URL) *" value={form.pptUrl}
                                    onChange={e => setForm(p => ({ ...p, pptUrl: e.target.value }))} />
                            )}
                            <p className="text-xs text-gray-500">Max team size: {teamSize}.</p>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => { setFlow('choose'); setError(''); }}
                                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/30 text-sm">Back</button>
                                <button onClick={handleCreate}
                                    disabled={loading || !form.name || !form.email || !form.githubUrl || !form.linkedinUrl || !form.teamName}
                                    className="flex-1 btn-neon-cyan py-2 text-sm disabled:opacity-50">
                                    {loading ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Join */}
                    {flow === 'join' && (
                        <div className="space-y-3">
                            <div className="text-sm font-semibold text-cyan-300">Your Details</div>
                            <input className={inputCls} placeholder="Your Name *" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                            <input className={inputCls} placeholder="Your Email *" type="email" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                            <input className={inputCls} placeholder="GitHub Profile URL *" value={form.githubUrl}
                                onChange={e => setForm(p => ({ ...p, githubUrl: e.target.value }))} />
                            <input className={inputCls} placeholder="LinkedIn Profile URL *" value={form.linkedinUrl}
                                onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} />
                            <div className="text-sm font-semibold text-cyan-300 pt-1">Team Code</div>
                            <input className={inputCls} placeholder="6-character team code *" value={form.joinCode}
                                onChange={e => setForm(p => ({ ...p, joinCode: e.target.value.toUpperCase() }))} maxLength={6} />
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => { setFlow('choose'); setError(''); }}
                                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/30 text-sm">Back</button>
                                <button onClick={handleJoin}
                                    disabled={loading || !form.name || !form.email || !form.githubUrl || !form.linkedinUrl || form.joinCode.length < 6}
                                    className="flex-1 btn-neon-cyan py-2 text-sm disabled:opacity-50">
                                    {loading ? 'Joining...' : 'Join Team'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Team ready */}
                    {flow === 'team_ready' && team && (
                        <div className="space-y-5">

                            {/* Team code — only before lock and if not already full for solo */}
                            {!isLocked && (team.maxMembers > 1 || team.members.length < team.maxMembers) && (
                                <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-2">Share with teammates to join:</div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 text-2xl font-mono font-bold text-cyan-300 tracking-widest bg-black/50 rounded-lg px-4 py-2 text-center">
                                            {team.teamCode}
                                        </div>
                                        <button onClick={copyCode}
                                            className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20">
                                            {copied ? <Check className="w-4 h-4 text-lime-300" /> : <Copy className="w-4 h-4 text-cyan-300" />}
                                        </button>
                                        <button onClick={refreshTeam}
                                            className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20">
                                            <RefreshCw className={`w-4 h-4 text-cyan-300 ${refreshing ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Members */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-white">
                                        Members ({team.members.length}/{team.maxMembers})
                                    </span>
                                    {team.members.length >= team.maxMembers && (
                                        <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded-full">
                                            Team size full
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {team.members.map((m, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border ${m.isLeader ? 'bg-amber-500/5 border-amber-500/30' : 'bg-black/30 border-purple-500/10'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${m.isLeader ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-white text-sm font-semibold">{m.name}</span>
                                                        {m.isLeader && (
                                                            <span className="flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                                                                <Crown className="w-3 h-3" /> Leader
                                                            </span>
                                                        )}
                                                        {m.walletAddress.toLowerCase() === myWallet && (
                                                            <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">You</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5 truncate">{m.email}</div>
                                                    <div className="flex gap-3 mt-1">
                                                        <a href={m.githubUrl} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-300">
                                                            <Github className="w-3 h-3" /> GitHub
                                                        </a>
                                                        <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-300">
                                                            <Linkedin className="w-3 h-3" /> LinkedIn
                                                        </a>
                                                    </div>
                                                </div>
                                                {/* Edit own details button — any member, before lock */}
                                                {m.walletAddress.toLowerCase() === myWallet && !isLocked && (
                                                    <button onClick={() => setIsEditingSelf(!isEditingSelf)}
                                                        className="p-1.5 text-gray-500 hover:text-cyan-300 transition-colors shrink-0">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Inline self-edit form */}
                                            {m.walletAddress.toLowerCase() === myWallet && isEditingSelf && !isLocked && (
                                                <div className="mt-3 pt-3 border-t border-cyan-500/10 space-y-2">
                                                    <input className={inputCls} placeholder="Name" value={form.name}
                                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                                    <input className={inputCls} placeholder="Email" type="email" value={form.email}
                                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                                                    <input className={inputCls} placeholder="GitHub URL" value={form.githubUrl}
                                                        onChange={e => setForm(p => ({ ...p, githubUrl: e.target.value }))} />
                                                    <input className={inputCls} placeholder="LinkedIn URL" value={form.linkedinUrl}
                                                        onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setIsEditingSelf(false)}
                                                            className="flex-1 px-3 py-1.5 border border-gray-600 rounded text-gray-300 text-xs">Cancel</button>
                                                        <button onClick={handleSaveSelfEdit} disabled={loading}
                                                            className="flex-1 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-300 text-xs hover:bg-cyan-500/30 disabled:opacity-50">
                                                            {loading ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Empty slots */}
                                    {Array.from({ length: team.maxMembers - team.members.length }).map((_, i) => (
                                        <div key={`empty-${i}`}
                                            className="p-3 rounded-lg border border-dashed border-gray-700 flex items-center gap-3 opacity-40">
                                            <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
                                                <UserPlus className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <span className="text-xs text-gray-500">Waiting for member...</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Leader: edit team name / ppt */}
                            {isLeader && !isLocked && (
                                <div className="border-t border-cyan-500/10 pt-4">
                                    <button onClick={() => setIsEditingTeam(!isEditingTeam)}
                                        className="flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-100 mb-3">
                                        <Pencil className="w-3 h-3" />
                                        {isEditingTeam ? 'Cancel' : (pptRequired ? 'Edit team name / PPT' : 'Edit team name')}
                                    </button>
                                    {isEditingTeam && (
                                        <div className="space-y-2">
                                            <input className={inputCls} placeholder={`Team name (current: ${team.teamName})`}
                                                value={form.teamName} onChange={e => setForm(p => ({ ...p, teamName: e.target.value }))} />
                                            {pptRequired && (
                                                <input className={inputCls} placeholder="PPT Link"
                                                    value={form.pptUrl} onChange={e => setForm(p => ({ ...p, pptUrl: e.target.value }))} />
                                            )}
                                            <button onClick={handleSaveTeamEdit} disabled={loading}
                                                className="w-full btn-neon-cyan py-2 text-sm disabled:opacity-50">
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PPT warning */}
                            {isLeader && !isLocked && pptRequired && !team.pptUrl && !isEditingTeam && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                                    ⚠ PPT is required. Click "Edit team name / PPT" above to add it before submitting.
                                </div>
                            )}

                            {/* Action area */}
                            {isLocked ? (
                                team.status === 'accepted' ? (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-lime-400/10 border border-lime-400/30 rounded-lg text-center">
                                            <div className="text-lime-300 font-semibold">✓ Application Approved</div>
                                            <div className="text-gray-400 text-xs mt-1">Your team has been selected!</div>
                                        </div>
                                        {/* Show submit project / ended based on competition timing */}
                                        {(() => {
                                            const now = Date.now();
                                            // competition object not in scope here — use team status + lockedAt as proxy
                                            // The parent page passes startDate and submissionDeadline as props if needed
                                            // For now show the button — parent can pass dates as props for full control
                                            return null; // handled by parent competition page sidebar
                                        })()}
                                    </div>
                                ) : team.status === 'rejected' ? (
                                    <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-lg text-center">
                                        <div className="text-red-300 font-semibold">✗ Application Rejected</div>
                                        <div className="text-gray-400 text-xs mt-1">Your team was not selected</div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-lime-400/10 border border-lime-400/30 rounded-lg text-center">
                                        <div className="text-lime-300 font-semibold">✓ Application Submitted</div>
                                        <div className="text-gray-400 text-xs mt-1">Awaiting organizer review</div>
                                    </div>
                                )
                            ) : isLeader ? (
                                <div className="space-y-2 border-t border-cyan-500/10 pt-4">
                                    <p className="text-xs text-gray-500 text-center">After submitting, no edits or new members allowed.</p>
                                    <button onClick={handleSubmitTeam}
                                        disabled={loading || (pptRequired && !form.pptUrl && !team.pptUrl)}
                                        className="w-full btn-neon-cyan py-3 font-semibold disabled:opacity-50">
                                        {loading ? 'Submitting...' : '🚀 Submit Application'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 border-t border-cyan-500/10 pt-4">
                                    {team.status === 'pending' && team.lockedAt ? (
                                        <div className="p-4 bg-lime-400/10 border border-lime-400/30 rounded-lg text-center">
                                            <div className="text-lime-300 font-semibold">✓ Application Submitted</div>
                                            <div className="text-gray-400 text-xs mt-1">Awaiting organizer review</div>
                                        </div>
                                    ) : team.status === 'accepted' ? (
                                        <div className="p-4 bg-lime-400/10 border border-lime-400/30 rounded-lg text-center">
                                            <div className="text-lime-300 font-semibold">✓ Application Accepted</div>
                                            <div className="text-gray-400 text-xs mt-1">Your team has been accepted</div>
                                        </div>
                                    ) : team.status === 'rejected' ? (
                                        <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-lg text-center">
                                            <div className="text-red-300 font-semibold">✗ Application Rejected</div>
                                            <div className="text-gray-400 text-xs mt-1">Your team was not selected</div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-black/30 border border-gray-700 rounded-lg text-center">
                                            <div className="text-gray-400 text-xs">Waiting for the team leader to submit.</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                                Close & Come Back Later
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}