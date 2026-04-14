import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';
import { Application } from '@/models/Application';
import { Submission } from '@/models/Submission';
import { Vote } from '@/models/Vote';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase();
        if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

        // User profile
        const user = await User.findOne({ walletAddress: { $regex: new RegExp(`^${wallet}$`, 'i') } }).lean();

        // Competitions sponsored by this user
        const sponsored = await Competition.find({ sponsorWallet: wallet })
            .sort({ createdAt: -1 }).lean();

        // Applications this wallet is part of (as member)
        const applications = await Application.find({
            'members.walletAddress': wallet,
            status: 'accepted',
        }).lean();

        const participantCompIds = applications.map(a => a.competitionId);
        const participantComps = await Competition.find({
            _id: { $in: participantCompIds },
        }).lean();

        // Map application by competitionId for quick lookup
        const appByCompId: Record<string, typeof applications[0]> = {};
        for (const app of applications) {
            appByCompId[String(app.competitionId)] = app;
        }

        // Competitions where this wallet is a judge (case-insensitive) OR email matches
        const email = user?.email?.toLowerCase();
        
        const judgeOrFilters: any[] = [
            { judges: { $elemMatch: { type: 'wallet', value: { $regex: new RegExp(`^${wallet}$`, 'i') } } } }
        ];
        if (email) {
            judgeOrFilters.push({ judges: { $elemMatch: { type: 'email', value: { $regex: new RegExp(`^${email}$`, 'i') } } } });
        }

        const judgingComps = await Competition.find({
            $or: judgeOrFilters,
            status: { $ne: 'draft' },
        }).sort({ createdAt: -1 }).lean();

        // Votes cast by this wallet (case-insensitive) OR email
        const voteOrFilters: any[] = [{ judgeWallet: { $regex: new RegExp(`^${wallet}$`, 'i') } }];
        if (email) {
            voteOrFilters.push({ judgeEmail: { $regex: new RegExp(`^${email}$`, 'i') } });
        }
        const votes = await Vote.find({ $or: voteOrFilters }).lean();
        const votedCompIds = [...new Set(votes.map(v => String(v.competitionId)))];

        // Submissions made by this wallet's teams
        const submissions = await Submission.find({
            competitionId: { $in: participantCompIds },
        }).lean();
        const submissionByCompId: Record<string, typeof submissions[0]> = {};
        for (const sub of submissions) {
            submissionByCompId[String(sub.competitionId)] = sub;
        }

        // Prize winnings — computed after getPhase is defined (see below).
        // The array is populated by the loop that follows getPhase().
        const prizeWins: Array<{
            competitionId: string;
            competitionTitle: string;
            rank: number;
            prizeAmount: number;
            pct: number;
            txHash: string | null;
            date: string;
        }> = [];

        const SPLITS: Record<number, number[]> = {
            1: [100],
            3: [50, 30, 20],
            5: [45, 30, 15, 5, 5],
            10: [30, 20, 15, 10, 7, 7, 3, 3, 2.5, 2.5],
        };

        const memberSince = user ? (user as any).createdAt?.toISOString?.() ?? (user as any).createdAt ?? null : null;

        const getPhase = (c: any) => {
            const now = new Date();
            if (now < new Date(c.startDate)) return 'upcoming';
            if (now <= new Date(c.submissionDeadline)) return 'live';
            if (now <= new Date(c.votingDeadline)) return 'voting';
            if (c.txHash) return 'completed';
            return 'pending_tx';
        };

        // Re-calculate prize wins using getPhase so we catch both 'completed' and
        // 'pending_tx' competitions (voting ended but on-chain tx not yet settled).
        // Previously this relied on c.status from the DB which is 'pending_tx'
        // until an admin submits the settlement tx, causing prize data to disappear.
        for (const comp of participantComps.filter(c => {
            const phase = getPhase(c);
            return phase === 'completed' || phase === 'pending_tx';
        })) {
            // Skip if we already processed this competition in the earlier loop
            if (prizeWins.some(p => p.competitionId === String(comp._id))) continue;

            const app = appByCompId[String(comp._id)];
            if (!app) continue;
            const sub = await Submission.findOne({
                competitionId: comp._id,
                teamId: app._id,
            }).lean();
            if (!sub) continue;

            const allSubs = await Submission.find({ competitionId: comp._id }).lean();
            const subIds = allSubs.map(s => s._id);
            const allVotes = await Vote.find({
                competitionId: comp._id,
                submissionId: { $in: subIds },
            }).lean();

            const scoreMap2: Record<string, number[]> = {};
            for (const v of allVotes) {
                const key = String(v.submissionId);
                if (!scoreMap2[key]) scoreMap2[key] = [];
                scoreMap2[key].push(v.score);
            }

            const ranked2 = allSubs
                .map(s => ({
                    id: String(s._id),
                    avg: scoreMap2[String(s._id)]?.length
                        ? scoreMap2[String(s._id)].reduce((a, b) => a + b, 0) / scoreMap2[String(s._id)].length
                        : 0,
                }))
                .sort((a, b) => b.avg - a.avg);

            const rank2 = ranked2.findIndex(r => r.id === String(sub._id)) + 1;
            const splits2 = SPLITS[comp.numWinners] || SPLITS[3];
            if (rank2 > 0 && rank2 <= comp.numWinners) {
                const pct = splits2[rank2 - 1];
                prizeWins.push({
                    competitionId: String(comp._id),
                    competitionTitle: comp.title,
                    rank: rank2,
                    prizeAmount: (comp.prizePoolPOL * pct) / 100,
                    pct,
                    txHash: comp.txHash,
                    date: comp.updatedAt.toISOString().split('T')[0],
                });
            }
        }

        // Stats — computed after prizeWins is fully populated
        const totalPrizeWon = prizeWins.reduce((sum, p) => sum + p.prizeAmount, 0);

        return NextResponse.json({
            user,
            stats: {
                totalPrizeWon,
                competitionsJoined: participantComps.length,
                competitionsSponsored: sponsored.length,
                judgingTasks: judgingComps.length,
                votesSubmitted: votes.length,
                memberSince,
            },
            sponsored: sponsored.map(c => ({
                id: String(c._id),
                title: c.title,
                status: getPhase(c),
                prizePoolPOL: c.prizePoolPOL,
                numWinners: c.numWinners,
                startDate: c.startDate,
                submissionDeadline: c.submissionDeadline,
                votingDeadline: c.votingDeadline,
                category: c.category,
                txHash: c.txHash,
            })),
            participating: participantComps.map(c => ({
                id: String(c._id),
                title: c.title,
                status: getPhase(c),
                prizePoolPOL: c.prizePoolPOL,
                startDate: c.startDate,
                submissionDeadline: c.submissionDeadline,
                category: c.category,
                hasSubmitted: !!submissionByCompId[String(c._id)],
                teamName: appByCompId[String(c._id)]?.teamName ?? '',
            })),
            judging: judgingComps.map(c => ({
                id: String(c._id),
                title: c.title,
                status: getPhase(c),
                votingDeadline: c.votingDeadline,
                hasVoted: votedCompIds.includes(String(c._id)),
                totalJudges: c.judges.length,
            })),
            prizes: prizeWins,
        });
    } catch (err: any) {
        console.error('[dashboard]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}