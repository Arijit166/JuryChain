import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Submission } from '@/models/Submission';
import { Competition } from '@/models/Competition';

// GET /api/submissions/list?competitionId=...&wallet=...
export async function GET(req: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId');
    const wallet = searchParams.get('wallet');

    if (!competitionId || !wallet) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Only sponsor can view all submissions
    const competition = await Competition.findById(competitionId);
    if (!competition) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (competition.sponsorWallet.toLowerCase() !== wallet.toLowerCase()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const submissions = await Submission.find({ competitionId }).sort({ updatedAt: -1 });
    return NextResponse.json({ submissions });
}