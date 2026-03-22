'use client';

import { useState } from 'react';
import { X, Users, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
    competitionId: string;
    teamSize: number;
    pptRequired: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Flow = 'choose' | 'create' | 'join' | 'team_ready';

export default function ApplyModal({ competitionId, teamSize, pptRequired, onClose, onSuccess }: Props) {
    const { userInfo } = useAuth();
    const [flow, setFlow] = useState<Flow>('choose');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [createdTeam, setCreatedTeam] = useState<any>(null);

    const [form, setForm] = useState({
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        linkedinUrl: '',
        githubUrl: '',
        teamName: '',
        pptUrl: '',
        joinCode: '',
    });

    const member = {
        name: form.name,
        email: form.email,
        walletAddress: userInfo?.walletAddress || '',
        linkedinUrl: form.linkedinUrl,
        githubUrl: form.githubUrl,
    };

    const handleCreate = async () => {
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
            setCreatedTeam(data.application);
            setFlow('team_ready');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleJoin = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/applications/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamCode: form.joinCode, member }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCreatedTeam(data.application);
            setFlow('team_ready');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleSubmitTeam = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/applications/submit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamCode: createdTeam.teamCode,
                    walletAddress: userInfo?.walletAddress,
                    pptUrl: form.pptUrl || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSuccess();
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const inputCls = "w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-card border-cyan-500/20 w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-cyan-500/10">
                    <h2 className="text-xl font-bold text-white">Apply to Competition</h2>
                    <button onClick={onClose} className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}

                    {/* Step 1: Choose flow */}
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

                    {/* Step 2a: Create team */}
                    {flow === 'create' && (
                        <div className="space-y-3">
                            <div className="text-sm font-semibold text-cyan-300 mb-2">Your Details</div>
                            <input className={inputCls} placeholder="Your Name *" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                            <input className={inputCls} placeholder="Your Email *" type="email" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                            <input className={inputCls} placeholder="GitHub Profile URL *" value={form.githubUrl}
                                onChange={e => setForm(p => ({ ...p, githubUrl: e.target.value }))} />
                            <input className={inputCls} placeholder="LinkedIn Profile URL *" value={form.linkedinUrl}
                                onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} />
                            <div className="text-sm font-semibold text-cyan-300 mt-4 mb-2">Team Details</div>
                            <input className={inputCls} placeholder="Team Name (unique) *" value={form.teamName}
                                onChange={e => setForm(p => ({ ...p, teamName: e.target.value }))} />
                            {pptRequired && (
                                <input className={inputCls} placeholder="PPT Link (Google Slides / Drive URL) *" value={form.pptUrl}
                                    onChange={e => setForm(p => ({ ...p, pptUrl: e.target.value }))} />
                            )}
                            <p className="text-xs text-gray-500">Max team size: {teamSize}. After creating, share the team code with teammates.</p>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setFlow('choose'); setError(''); }}
                                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/30 text-sm transition-colors">Back</button>
                                <button onClick={handleCreate} disabled={loading || !form.name || !form.email || !form.githubUrl || !form.linkedinUrl || !form.teamName}
                                    className="flex-1 btn-neon-cyan py-2 text-sm disabled:opacity-50">
                                    {loading ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2b: Join team */}
                    {flow === 'join' && (
                        <div className="space-y-3">
                            <div className="text-sm font-semibold text-cyan-300 mb-2">Your Details</div>
                            <input className={inputCls} placeholder="Your Name *" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                            <input className={inputCls} placeholder="Your Email *" type="email" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                            <input className={inputCls} placeholder="GitHub Profile URL *" value={form.githubUrl}
                                onChange={e => setForm(p => ({ ...p, githubUrl: e.target.value }))} />
                            <input className={inputCls} placeholder="LinkedIn Profile URL *" value={form.linkedinUrl}
                                onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} />
                            <div className="text-sm font-semibold text-cyan-300 mt-4 mb-2">Team Code</div>
                            <input className={inputCls} placeholder="6-character team code *" value={form.joinCode}
                                onChange={e => setForm(p => ({ ...p, joinCode: e.target.value.toUpperCase() }))}
                                maxLength={6} />
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setFlow('choose'); setError(''); }}
                                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/30 text-sm transition-colors">Back</button>
                                <button onClick={handleJoin} disabled={loading || !form.name || !form.email || !form.githubUrl || !form.linkedinUrl || form.joinCode.length < 6}
                                    className="flex-1 btn-neon-cyan py-2 text-sm disabled:opacity-50">
                                    {loading ? 'Joining...' : 'Join Team'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Team ready — share code or submit */}
                    {flow === 'team_ready' && createdTeam && (
                        <div className="space-y-4">
                            <div className="p-4 bg-lime-400/10 border border-lime-400/30 rounded-lg text-center">
                                <div className="text-lime-300 font-bold text-lg mb-1">{createdTeam.teamName}</div>
                                <div className="text-gray-400 text-sm mb-3">Your team code — share with teammates:</div>
                                <div className="text-3xl font-mono font-bold text-cyan-300 tracking-widest bg-black/50 rounded-lg p-3">
                                    {createdTeam.teamCode}
                                </div>
                            </div>
                            <div className="text-sm text-gray-400">
                                <span className="text-white font-semibold">Members:</span> {createdTeam.members.length} / {createdTeam.maxMembers}
                            </div>
                            <p className="text-xs text-gray-500">
                                Once all your team members have joined, the team leader submits the application. After submission, no new members can join.
                            </p>
                            {pptRequired && !createdTeam.pptUrl && (
                                <input className={inputCls} placeholder="PPT Link (required before submit)"
                                    value={form.pptUrl} onChange={e => setForm(p => ({ ...p, pptUrl: e.target.value }))} />
                            )}
                            <button onClick={handleSubmitTeam}
                                disabled={loading || (pptRequired && !form.pptUrl && !createdTeam.pptUrl)}
                                className="w-full btn-neon-cyan py-3 disabled:opacity-50">
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                            <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                Close & Come Back Later
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}