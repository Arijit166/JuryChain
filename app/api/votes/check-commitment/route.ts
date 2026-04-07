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
        return NextResponse.json({ commitmentKey: null });
    }

    const existing = await Vote.findOne({
        competitionId,
        $or: [
            ...(judgeWallet ? [{ judgeWallet: judgeWallet.toLowerCase() }] : []),
            ...(judgeEmail ? [{ judgeEmail: judgeEmail.toLowerCase() }] : []),
        ],
    }).select('commitmentKey').lean();

    return NextResponse.json({
        commitmentKey: existing ? (existing as any).commitmentKey : null,
    });
}