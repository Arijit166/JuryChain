import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Vote } from '@/models/Vote';

export async function GET(req: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId');
    const judgeWallet = searchParams.get('judgeWallet');
    const judgeEmail = searchParams.get('judgeEmail');

    if (!competitionId || (!judgeWallet && !judgeEmail)) {
        return NextResponse.json({ votedSubmissionIds: [] });
    }

    const votes = await Vote.find({
        competitionId,
        $or: [
            ...(judgeWallet ? [{ judgeWallet: judgeWallet.toLowerCase() }] : []),
            ...(judgeEmail ? [{ judgeEmail: judgeEmail.toLowerCase() }] : []),
        ],
    }).select('submissionId score').lean();

    return NextResponse.json({
        votedSubmissionIds: votes.map((v) => String((v as any).submissionId)),
        voteScores: votes.reduce((acc, v: any) => {
            acc[String(v.submissionId)] = v.score;
            return acc;
        }, {} as Record<string, number>)
    });
}