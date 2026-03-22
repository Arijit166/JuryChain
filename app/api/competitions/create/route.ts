import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';

const CATEGORY_MAP: Record<string, number> = { Any: 0, ML: 1, Web3: 2, IoT: 3 };

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const {
            title, description, prizePoolPOL, numWinners,
            startDate, submissionDeadline, votingDeadline,
            applyDeadline, venue, teamSize,
            judges, judgeMerkleRoot, isPublic,
            sponsorWallet, txHash, contractCompetitionId,
            pptRequired, category,
        } = body;

        if (!title || !description || !prizePoolPOL || !sponsorWallet)
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        if (!judges || judges.length < 3)
            return NextResponse.json({ error: 'At least 3 judges required' }, { status: 400 });
        if (new Date(startDate) <= new Date())
            return NextResponse.json({ error: 'Start date must be in the future' }, { status: 400 });
        if (new Date(applyDeadline) >= new Date(submissionDeadline))
            return NextResponse.json({ error: 'Apply deadline must be before submission deadline' }, { status: 400 });
        if (new Date(submissionDeadline) <= new Date(startDate))
            return NextResponse.json({ error: 'Submission deadline must be after start date' }, { status: 400 });
        if (new Date(votingDeadline) <= new Date(submissionDeadline))
            return NextResponse.json({ error: 'Voting deadline must be after submission deadline' }, { status: 400 });

        const competition = await Competition.create({
            title, description,
            prizePool: String(prizePoolPOL),
            prizePoolPOL: Number(prizePoolPOL),
            numWinners: Number(numWinners),
            startDate: new Date(startDate),
            applyDeadline: new Date(applyDeadline),
            submissionDeadline: new Date(submissionDeadline),
            votingDeadline: new Date(votingDeadline),
            venue,
            teamSize: Number(teamSize) || 5,
            judges,
            judgeMerkleRoot: judgeMerkleRoot || ('0x' + '0'.repeat(64)),
            isPublic: Boolean(isPublic),
            sponsorWallet: sponsorWallet.toLowerCase(),
            txHash: txHash || null,
            contractCompetitionId: contractCompetitionId ?? null,
            status: txHash ? 'live' : 'pending_tx',
            pptRequired: Boolean(pptRequired),
            category: category || 'Any',
        });

        return NextResponse.json({ success: true, competition }, { status: 201 });
    } catch (err: any) {
        console.error('[create-competition]', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}