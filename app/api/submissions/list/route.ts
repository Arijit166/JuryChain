import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Submission } from '@/models/Submission';
import { Competition } from '@/models/Competition';

// GET /api/submissions/list?competitionId=...&wallet=...&email=...
export async function GET(req: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId');
    const wallet = searchParams.get('wallet');
    const email = searchParams.get('email');

    if (!competitionId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }
    if (!wallet && !email) {
        return NextResponse.json({ error: 'Missing wallet or email' }, { status: 400 });
    }

    const competition = await Competition.findById(competitionId);
    if (!competition) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    // Check if caller is sponsor
    const isSponsor = wallet && competition.sponsorWallet.toLowerCase() === wallet.toLowerCase();
    
    // Check if caller is a judge
    const isJudge = competition.judges?.some((j: { type: string; value: string }) => {
        if (j.type === 'wallet' && wallet) {
            return j.value.toLowerCase() === wallet.toLowerCase();
        }
        if (j.type === 'email' && email) {
            return j.value.toLowerCase() === email.toLowerCase();
        }
        return false;
    });

    if (!isSponsor && !isJudge) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const submissions = await Submission.find({ competitionId }).sort({ updatedAt: -1 });
    return NextResponse.json({ submissions });
}