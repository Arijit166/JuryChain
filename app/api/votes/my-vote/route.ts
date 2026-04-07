import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Vote } from '@/models/Vote';

export async function GET(req: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const nullifierHash = searchParams.get('nullifierHash');
    const competitionId = searchParams.get('competitionId');

    if (!nullifierHash || !competitionId) {
        return NextResponse.json({ voted: false });
    }

    // Check if this exact nullifier already exists (globally unique)
    const existing = await Vote.findOne({ nullifierHash });

    // Also get every submissionId this competition's votes cover
    // so the UI can mark which projects were already scored
    const allVotes = existing
        ? await Vote.find({ competitionId }).select('submissionId nullifierHash').lean()
        : [];

    return NextResponse.json({
        voted: !!existing,
        votedSubmissionId: existing ? existing.submissionId : null,
    });
}