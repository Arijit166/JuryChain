import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Vote } from '@/models/Vote';
import { Competition } from '@/models/Competition';
import { Submission } from '@/models/Submission';

export async function POST(req: NextRequest) {
    await connectDB();

    const { competitionId, submissionId, nullifierHash, score, judgeWallet, judgeEmail } =
        await req.json();

    if (!competitionId || !submissionId || !nullifierHash || !score || (!judgeWallet && !judgeEmail)) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof score !== 'number' || score < 1 || score > 10) {
        return NextResponse.json({ error: 'Score must be between 1 and 10' }, { status: 400 });
    }

    const comp = await Competition.findById(competitionId);
    if (!comp) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

    // Verify judge is in the approved judges array
    const isJudge = comp.judges.some(
        (j: { type: string; value: string }) =>
            (j.type === 'wallet' && judgeWallet && j.value.toLowerCase() === judgeWallet.toLowerCase()) ||
            (j.type === 'email' && judgeEmail && j.value.toLowerCase() === judgeEmail.toLowerCase())
    );
    if (!isJudge) {
        return NextResponse.json({ error: 'Not an approved judge for this competition' }, { status: 403 });
    }

    // Voting window check
    const now = new Date();
    if (now < new Date(comp.submissionDeadline)) {
        return NextResponse.json({ error: 'Voting has not started yet' }, { status: 400 });
    }
    if (now > new Date(comp.votingDeadline)) {
        return NextResponse.json({ error: 'Voting deadline has passed' }, { status: 400 });
    }

    // Verify submission belongs to this competition
    const submission = await Submission.findOne({
        _id: submissionId,
        competitionId,
    });
    if (!submission) {
        return NextResponse.json({ error: 'Submission not found in this competition' }, { status: 404 });
    }

    // Nullifier check — prevents double voting
    const existing = await Vote.findOne({ nullifierHash });
    if (existing) {
        return NextResponse.json({ error: 'Vote already submitted (nullifier reused)' }, { status: 409 });
    }

    const vote = await Vote.create({
        competitionId,
        submissionId,
        nullifierHash,
        score,
    });

    return NextResponse.json({ success: true, voteId: vote._id });
}