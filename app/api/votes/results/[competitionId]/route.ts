import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Vote } from '@/models/Vote';
import { Competition } from '@/models/Competition';
import { Submission } from '@/models/Submission';
import mongoose from 'mongoose';

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ competitionId: string }> }
) {
    await connectDB();
    const { competitionId } = await context.params;

    const comp = await Competition.findById(competitionId);
    if (!comp) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

    // Aggregate total score + vote count per submission
    const agg = await Vote.aggregate([
        {
            $match: {
                competitionId: new mongoose.Types.ObjectId(competitionId),
            },
        },
        {
            $group: {
                _id: '$submissionId',
                totalScore: { $sum: '$score' },
                voteCount: { $sum: 1 },
            },
        },
        { $sort: { totalScore: -1 } },
    ]);

    // Hydrate with Submission details
    const submissionIds = agg.map((a) => a._id);
    const submissions = await Submission.find({
        _id: { $in: submissionIds },
    }).lean();

    const subMap: Record<string, any> = {};
    submissions.forEach((s) => {
        subMap[String(s._id)] = s;
    });

    const totalVotesCast = agg.reduce((sum, a) => sum + a.voteCount, 0);

    const ranked = agg.map((a, idx) => {
        const sub = subMap[String(a._id)];
        return {
            rank: idx + 1,
            submissionId: String(a._id),
            totalScore: a.totalScore,
            voteCount: a.voteCount,
            averageScore: a.voteCount > 0
                ? parseFloat((a.totalScore / a.voteCount).toFixed(2))
                : 0,
            projectTitle: sub?.projectTitle ?? 'Unknown Project',
            teamName: sub?.teamName ?? 'Unknown Team',
            submittedBy: sub?.submittedBy ?? '',
            repoUrl: sub?.repoUrl ?? '',
            demoUrl: sub?.demoUrl ?? '',
        };
    });

    return NextResponse.json({
        results: ranked,
        totalVotesCast,
        totalJudges: comp.judges.length,
        totalSubmissions: submissionIds.length,
        prizePool: comp.prizePool,
        prizePoolPOL: comp.prizePoolPOL,
        numWinners: comp.numWinners,
        competitionTitle: comp.title,
        votingDeadline: comp.votingDeadline,
        sponsorWallet: comp.sponsorWallet,
        txHash: comp.txHash,
    });
}