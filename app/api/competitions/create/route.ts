import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const {
            title,
            description,
            prizePoolUSD,
            numWinners,
            submissionDeadline,
            votingDeadline,
            judges,
            judgeMerkleRoot,
            isPublic,
            sponsorWallet,
            txHash,           // sent by client after on-chain tx
            contractCompetitionId,
        } = body;

        // Basic validation
        if (!title || !description || !prizePoolUSD || !sponsorWallet) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!judges || judges.length < 3) {
            return NextResponse.json({ error: 'At least 3 judges required' }, { status: 400 });
        }
        if (new Date(submissionDeadline) <= new Date()) {
            return NextResponse.json({ error: 'Submission deadline must be in the future' }, { status: 400 });
        }
        if (new Date(votingDeadline) <= new Date(submissionDeadline)) {
            return NextResponse.json({ error: 'Voting deadline must be after submission deadline' }, { status: 400 });
        }

        const competition = await Competition.create({
            title,
            description,
            prizePool: String(prizePoolUSD),   // store as string; wei handled on-chain
            prizePoolUSD: Number(prizePoolUSD),
            numWinners: Number(numWinners),
            submissionDeadline: new Date(submissionDeadline),
            votingDeadline: new Date(votingDeadline),
            judges,
            judgeMerkleRoot: judgeMerkleRoot || ('0x' + '0'.repeat(64)),
            isPublic: Boolean(isPublic),
            sponsorWallet: sponsorWallet.toLowerCase(),
            txHash: txHash || null,
            contractCompetitionId: contractCompetitionId ?? null,
            status: txHash ? 'live' : 'pending_tx',
        });

        return NextResponse.json({ success: true, competition }, { status: 201 });
    } catch (err: any) {
        console.error('[create-competition]', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}