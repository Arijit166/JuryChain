'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, CheckCircle, Loader2, Eye, AlertCircle } from 'lucide-react';
import { Identity } from '@semaphore-protocol/core';
import Link from 'next/link';

interface Submission {
    _id: string;
    projectTitle: string;
    description: string;
    repoUrl?: string;
    demoUrl?: string;
    teamName: string;
    submittedBy: string;
}

interface Competition {
    _id: string;
    title: string;
    submissionDeadline: string;
    votingDeadline: string;
    judges: Array<{ type: string; value: string }>;
}


// Uses the identity's nullifier field scoped to this competition
async function deriveNullifier(
    identity: Identity,
    competitionId: string,
    submissionId: string   // <-- scoped per project
): Promise<string> {
    const { poseidon2 } = await import('poseidon-lite');
    // Combine competitionId + submissionId so each project gets its own nullifier
    // but the same wallet+secret always produces the same result for the same project
    const combined = `${competitionId}:${submissionId}`;
    const encoded = new TextEncoder().encode(combined);
    let hex = '';
    encoded.forEach((b) => (hex += b.toString(16).padStart(2, '0')));
    const externalNullifier = BigInt('0x' + hex.slice(0, 62));
    const nullifierBig = poseidon2([identity.secretScalar, externalNullifier]);
    return nullifierBig.toString();
}

// Also add this helper — derives a stable commitment fingerprint
// used to lock a judge's secret key for this competition
async function deriveCommitmentKey(
    identity: Identity,
    competitionId: string
): Promise<string> {
    const { poseidon2 } = await import('poseidon-lite');
    const encoded = new TextEncoder().encode(`commitment:${competitionId}`);
    let hex = '';
    encoded.forEach((b) => (hex += b.toString(16).padStart(2, '0')));
    const ext = BigInt('0x' + hex.slice(0, 62));
    return poseidon2([identity.commitment, ext]).toString();
}

export default function VotePage({
    params,
}: {
    params: Promise<{ competitionId: string }>;
}) {
    const { competitionId } = use(params);
    const { userInfo } = useAuth();

    // ── data ────────────────────────────────────────────────────────────────
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── identity ─────────────────────────────────────────────────────────────
    const [secret, setSecret] = useState('');
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [identityReady, setIdentityReady] = useState(false);
    const [identityLoading, setIdentityLoading] = useState(false);
    const [alreadyVoted, setAlreadyVoted] = useState(false);
    const [votedSubmissionIds, setVotedSubmissionIds] = useState<Set<string>>(new Set());
    const [commitmentLocked, setCommitmentLocked] = useState(false);
    const [commitmentMismatch, setCommitmentMismatch] = useState(false);

    // ── voting ────────────────────────────────────────────────────────────────
    const [scores, setScores] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);
    // submissionId => 'voted' | 'error:<msg>'
    const [voteStatus, setVoteStatus] = useState<Record<string, string>>({});

    // ── load data ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const wallet = userInfo?.walletAddress ?? '';
        const email = userInfo?.email ?? '';
        const subParams = new URLSearchParams({ competitionId });
        if (wallet) subParams.set('wallet', wallet);
        if (email) subParams.set('email', email);

        Promise.all([
            fetch(`/api/competitions/${competitionId}`).then((r) => r.json()),
            fetch(`/api/submissions/list?${subParams.toString()}`).then((r) =>
                r.json()
            ),
        ])
            .then(([compData, subData]) => {
                if (compData.error) { setError(compData.error); return; }
                setCompetition(compData.competition);
                setSubmissions(subData.submissions ?? []);
            })
            .catch(() => setError('Failed to load competition data'))
            .finally(() => setLoading(false));
    }, [competitionId, userInfo]);

    // ── generate identity ─────────────────────────────────────────────────────
    const generateIdentity = useCallback(async () => {
        if (!secret.trim()) return;
        if (!userInfo?.walletAddress && !userInfo?.email) return;
        setIdentityLoading(true);
        try {
            const identifier = userInfo?.walletAddress
                ? userInfo.walletAddress.toLowerCase()
                : userInfo!.email!.toLowerCase();
            const trapdoor = `${identifier}::${secret}`;
            const id = new Identity(trapdoor);
            setIdentity(id);

            // Derive the competition-scoped commitment key
            const commitKey = await deriveCommitmentKey(id, competitionId);

            // Check server: has this judge registered a commitment key before?
            const lockRes = await fetch(
                `/api/votes/check-commitment?competitionId=${competitionId}&judgeWallet=${userInfo?.walletAddress ?? ''}&judgeEmail=${userInfo?.email ?? ''}`
            );
            const lockData = await lockRes.json();

            if (lockData.commitmentKey) {
                // Judge has voted before — verify they're using the SAME secret
                if (lockData.commitmentKey !== commitKey) {
                    setCommitmentMismatch(true);
                    setIdentityReady(false);
                    setIdentityLoading(false);
                    return;
                }
            }
            setCommitmentMismatch(false);
            setCommitmentLocked(!!lockData.commitmentKey);

            // Load which submissions this identity has already voted on
            const alreadyRes = await fetch(
                `/api/votes/my-votes?competitionId=${competitionId}&judgeWallet=${userInfo?.walletAddress ?? ''}&judgeEmail=${userInfo?.email ?? ''}`
            );
            const alreadyData = await alreadyRes.json();
            setVotedSubmissionIds(new Set<string>(alreadyData.votedSubmissionIds ?? []));
            if (alreadyData.voteScores) {
                setScores((prev) => ({ ...prev, ...alreadyData.voteScores }));
            }
            setAlreadyVoted(false); // don't block — let them score remaining projects
            setIdentityReady(true);
        } catch (e) {
            console.error(e);
            setError('Failed to generate identity');
        } finally {
            setIdentityLoading(false);
        }
    }, [userInfo, secret, competitionId]);

    // ── submit a single vote ──────────────────────────────────────────────────
    const submitVote = useCallback(
        async (submissionId: string) => {
            if (!identity || (!userInfo?.walletAddress && !userInfo?.email)) return;
            const score = scores[submissionId];
            if (!score) { alert('Please select a score first'); return; }

            setSubmitting(submissionId);
            try {
                // Per-project nullifier — same identity can't vote twice on same project
                const nullifierHash = await deriveNullifier(identity, competitionId, submissionId);
                // Competition-scoped commitment key — locks this judge to this secret
                const commitmentKey = await deriveCommitmentKey(identity, competitionId);

                const res = await fetch('/api/votes/commit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        competitionId,
                        submissionId,
                        nullifierHash,
                        commitmentKey,
                        score,
                        judgeWallet: userInfo?.walletAddress,
                        judgeEmail: userInfo?.email,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'Vote submission failed');

                setVoteStatus((prev) => ({ ...prev, [submissionId]: 'voted' }));
                setVotedSubmissionIds((prev) => new Set([...prev, submissionId]));
                // Do NOT set alreadyVoted true — let them continue scoring other projects
            } catch (e: any) {
                setVoteStatus((prev) => ({
                    ...prev,
                    [submissionId]: `error:${e.message}`,
                }));
            } finally {
                setSubmitting(null);
            }
        },
        [identity, userInfo, scores, competitionId]
    );

    // ── derived state ──────────────────────────────────────────────────────────
    const now = new Date();
    const votingOpen =
        competition !== null &&
        now >= new Date(competition.submissionDeadline) &&
        now <= new Date(competition.votingDeadline);

    const isJudge =
        !!competition &&
        competition.judges.some(
            (j) =>
                (j.type === 'wallet' &&
                    !!userInfo?.walletAddress &&
                    j.value.toLowerCase() === userInfo.walletAddress.toLowerCase()) ||
                (j.type === 'email' &&
                    !!userInfo?.email &&
                    j.value.toLowerCase() === userInfo.email.toLowerCase())
        );

    const hasAnyVoteSubmitted = Object.values(voteStatus).includes('voted');
    const allVotesSubmitted =
        submissions.length > 0 &&
        submissions.every(
            (s) => voteStatus[s._id] === 'voted' || votedSubmissionIds.has(s._id)
        );

    // ── render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                </main>
            </ProtectedRoute>
        );
    }

    if (error || !competition) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-background flex items-center justify-center">
                    <p className="text-red-400">{error || 'Competition not found'}</p>
                </main>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-background">
                <Navbar />

                {/* ── Hero ── */}
                <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10 bg-gradient-to-b from-purple-950/20 to-transparent">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-purple-300" />
                            <span className="text-sm text-purple-300 font-semibold uppercase tracking-wider">
                                Judge Portal
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-3">
                            <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                                Anonymous Voting
                            </span>
                        </h1>
                        <p className="text-base text-gray-400 max-w-2xl mx-auto">{competition.title}</p>
                        <div className="mt-3 flex justify-center gap-4 text-xs text-gray-500">
                            <span>
                                Voting opens:{' '}
                                <span className="text-gray-300">
                                    {new Date(competition.submissionDeadline).toLocaleString()}
                                </span>
                            </span>
                            <span>
                                Closes:{' '}
                                <span className="text-gray-300">
                                    {new Date(competition.votingDeadline).toLocaleString()}
                                </span>
                            </span>
                        </div>
                    </div>
                </section>

                <section className="py-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* ── Not a judge ── */}
                        {!isJudge && (
                            <div className="glass-card p-8 border-red-500/20 text-center">
                                <Lock className="w-10 h-10 text-red-400 mx-auto mb-3" />
                                <p className="text-red-300 font-semibold text-lg">
                                    Access Restricted
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    This page is only accessible to approved judges.
                                </p>
                                <Link
                                    href={`/competition/${competitionId}`}
                                    className="btn-ghost-neon inline-block mt-4 px-6 py-2 text-sm"
                                >
                                    Back to Competition
                                </Link>
                            </div>
                        )}

                        {/* ── Wrong secret ── */}
                        {commitmentMismatch && (
                            <div className="glass-card p-8 border-red-500/20 bg-red-500/5 text-center">
                                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                                <p className="text-red-300 font-semibold text-lg">Wrong Secret Phrase</p>
                                <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                                    You have already voted in this competition using a different secret phrase.
                                    Re-enter the same secret you used before to continue scoring remaining projects.
                                </p>
                                <button
                                    onClick={() => {
                                        setCommitmentMismatch(false);
                                        setIdentityReady(false);
                                        setSecret('');
                                        setIdentity(null);
                                    }}
                                    className="btn-ghost-neon inline-block mt-4 px-6 py-2 text-sm"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* ── Voting not open ── */}
                        {isJudge && !votingOpen && (
                            <div className="glass-card p-8 border-gray-500/20 text-center">
                                <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-300 font-semibold text-lg">
                                    {now < new Date(competition.submissionDeadline)
                                        ? 'Voting has not started yet — submissions are still open'
                                        : 'Voting period has ended'}
                                </p>
                                <Link
                                    href={`/competition/${competitionId}`}
                                    className="btn-ghost-neon inline-block mt-4 px-6 py-2 text-sm"
                                >
                                    Back to Competition
                                </Link>
                            </div>
                        )}

                        {/* ── Main voting flow ── */}
                        {isJudge && votingOpen && (
                            <>
                                {/* How it works */}
                                <div className="glass-card p-5 border-cyan-500/10 bg-black/20">
                                    <h3 className="text-sm font-semibold text-white mb-3">
                                        How anonymous voting works
                                    </h3>
                                    <div className="grid sm:grid-cols-3 gap-4 text-xs text-gray-400">
                                        <div className="flex gap-2">
                                            <span className="text-purple-300 font-bold">1.</span>
                                            <span>
                                                A Semaphore identity is generated from your wallet +
                                                secret. Your wallet is never stored.
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-purple-300 font-bold">2.</span>
                                            <span>
                                                A nullifier hash scoped to this competition proves you
                                                voted without revealing who you are.
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-purple-300 font-bold">3.</span>
                                            <span>
                                                Each identity can vote once. Reusing the same
                                                wallet+secret is rejected automatically.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Step 1: Identity setup ── */}
                                {!identityReady && (
                                    <div className="glass-card p-8 border-purple-500/20">
                                        <div className="flex items-start gap-4 mb-6">
                                            <Shield className="w-8 h-8 text-purple-300 mt-1 flex-shrink-0" />
                                            <div>
                                                <h2 className="text-xl font-bold text-white mb-1">
                                                    Step 1 — Generate Anonymous Identity
                                                </h2>
                                                <p className="text-sm text-gray-400">
                                                    Your identity is{' '}
                                                    <code className="text-cyan-300 bg-black/30 px-1 rounded">
                                                        Semaphore(wallet + secret)
                                                    </code>
                                                    . Only the nullifier hash touches our database — your
                                                    wallet and secret never leave your browser.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-white mb-2">
                                                    Connected Wallet
                                                </label>
                                                <div className="px-4 py-2 bg-black/50 rounded border border-cyan-500/30 text-gray-400 font-mono text-sm">
                                                    {userInfo?.walletAddress}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-white mb-1">
                                                    Secret Phrase
                                                </label>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    Pick anything you'll remember. Use the same phrase
                                                    each time — it deterministically regenerates your
                                                    identity.
                                                </p>
                                                <input
                                                    type="password"
                                                    placeholder="Enter a memorable secret phrase"
                                                    value={secret}
                                                    onChange={(e) => setSecret(e.target.value)}
                                                    onKeyDown={(e) =>
                                                        e.key === 'Enter' && generateIdentity()
                                                    }
                                                    className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                                />
                                            </div>

                                            <button
                                                onClick={generateIdentity}
                                                disabled={!secret.trim() || identityLoading}
                                                className="btn-neon-purple w-full py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {identityLoading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Generating…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shield className="w-4 h-4" />
                                                        Generate Identity & Start Voting
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Already voted all projects banner ── */}
                                {identityReady && allVotesSubmitted && (
                                    <div className="glass-card p-8 border-lime-400/20 bg-lime-400/5 text-center">
                                        <CheckCircle className="w-10 h-10 text-lime-400 mx-auto mb-3" />
                                        <p className="text-lime-300 font-semibold text-lg">
                                            All projects scored!
                                        </p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            You have submitted scores for every submission in this competition.
                                        </p>
                                        <Link
                                            href={`/competition/${competitionId}`}
                                            className="btn-ghost-neon inline-block mt-4 px-6 py-2 text-sm"
                                        >
                                            Back to Competition
                                        </Link>
                                    </div>
                                )}

                                {/* ── Identity ready banner ── */}
                                {identityReady && !alreadyVoted && (
                                    <div className="glass-card p-4 border-lime-400/20 bg-lime-400/5 flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-lime-300 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-lime-300">
                                                Anonymous Identity Active
                                            </p>
                                            <p className="text-xs text-gray-400 font-mono truncate">
                                                Commitment: {identity?.commitment.toString().slice(0, 24)}…
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIdentityReady(false);
                                                setSecret('');
                                                setIdentity(null);
                                            }}
                                            className="text-xs text-gray-500 hover:text-gray-300 flex-shrink-0"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}

                                {/* ── Submissions list ── */}
                                {identityReady && !alreadyVoted && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">
                                                Step 2 — Score Submissions
                                            </h2>
                                            <p className="text-sm text-gray-400">
                                                Score each project (1–10). Submitting a vote consumes
                                                your nullifier — you may only vote once across all
                                                projects in this competition.
                                            </p>
                                        </div>

                                        {submissions.length === 0 && (
                                            <div className="glass-card p-8 border-cyan-500/20 text-center">
                                                <p className="text-gray-400">
                                                    No submissions found for this competition yet.
                                                </p>
                                            </div>
                                        )}

                                        {submissions.map((sub) => {
                                            const status = voteStatus[sub._id];
                                            const isVoted = status === 'voted' || votedSubmissionIds.has(sub._id);
                                            const isError = status?.startsWith('error:');
                                            const errorMsg = isError
                                                ? status.replace('error:', '')
                                                : '';
                                            const isThisSubmitting = submitting === sub._id;

                                            return (
                                                <div
                                                    key={sub._id}
                                                    className={`glass-card p-6 border transition-all duration-300 ${isVoted
                                                        ? 'border-lime-400/40 bg-lime-400/5'
                                                        : isError
                                                            ? 'border-red-500/40'
                                                            : 'border-cyan-500/20 hover:border-cyan-500/40'
                                                        }`}
                                                >
                                                    {/* Project header */}
                                                    <div className="flex items-start justify-between gap-4 mb-4">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-bold text-white mb-0.5 truncate">
                                                                {sub.projectTitle}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mb-2">
                                                                Team:{' '}
                                                                <span className="text-gray-300">
                                                                    {sub.teamName}
                                                                </span>
                                                            </p>
                                                            <p className="text-sm text-gray-400 line-clamp-2">
                                                                {sub.description}
                                                            </p>
                                                            {/* Links */}
                                                            <div className="flex gap-4 mt-3 flex-wrap">
                                                                {sub.repoUrl && (
                                                                    <a
                                                                        href={sub.repoUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                        Repository
                                                                    </a>
                                                                )}
                                                                {sub.demoUrl && (
                                                                    <a
                                                                        href={sub.demoUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                        Live Demo
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {
                                                            isVoted && (
                                                                <CheckCircle className="w-6 h-6 text-lime-300 flex-shrink-0 mt-1" />
                                                            )
                                                        }
                                                    </div>

                                                    {/* Score + submit — only if not voted yet */}
                                                    {!isVoted && (
                                                        <>
                                                            <div className="mb-4">
                                                                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                                                    Score (1–10)
                                                                </label>
                                                                <div className="flex gap-1.5 flex-wrap">
                                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                                                        (n) => (
                                                                            <button
                                                                                key={n}
                                                                                onClick={() =>
                                                                                    setScores((prev) => ({
                                                                                        ...prev,
                                                                                        [sub._id]: n,
                                                                                    }))
                                                                                }
                                                                                disabled={!!submitting}
                                                                                className={`w-9 h-9 rounded font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed ${scores[sub._id] === n
                                                                                    ? 'bg-cyan-500 text-black scale-110 shadow-lg shadow-cyan-500/30'
                                                                                    : 'bg-black/50 text-gray-300 hover:bg-cyan-500/30 border border-cyan-500/10'
                                                                                    }`}
                                                                            >
                                                                                {n}
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>
                                                                {scores[sub._id] && (
                                                                    <p className="text-xs text-cyan-300 mt-1">
                                                                        Selected:{' '}
                                                                        <span className="font-bold">
                                                                            {scores[sub._id]}/10
                                                                        </span>
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => submitVote(sub._id)}
                                                                disabled={!scores[sub._id] || !!submitting}
                                                                className="btn-neon-cyan py-2 px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isThisSubmitting ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Generating ZK proof…
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Lock className="w-4 h-4" />
                                                                        Submit Anonymous Vote
                                                                    </>
                                                                )}
                                                            </button>

                                                            {isError && (
                                                                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {errorMsg}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Voted confirmation */}
                                                    {isVoted && (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-lime-300" />
                                                            <p className="text-sm text-lime-300 font-semibold">
                                                                Vote submitted — Score: {scores[sub._id]}/10
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ── Post-vote message ── */}
                                {identityReady && hasAnyVoteSubmitted && !allVotesSubmitted && (
                                    <div className="glass-card p-4 border-cyan-500/20 bg-cyan-500/5 text-center">
                                        <p className="text-cyan-300 text-sm">
                                            ✓ Votes recorded anonymously. Score the remaining projects above.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main >
        </ProtectedRoute >
    );
}