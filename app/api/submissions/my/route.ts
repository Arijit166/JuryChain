import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Submission } from '@/models/Submission';
import { Application } from '@/models/Application';
import { Competition } from '@/models/Competition';

// GET /api/submissions/my?competitionId=...&wallet=...
export async function GET(req: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId');
    const wallet = searchParams.get('wallet');

    if (!competitionId || !wallet) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Find the user's accepted application for this competition
    const application = await Application.findOne({
        competitionId,
        status: 'accepted',
        'members.walletAddress': { $regex: new RegExp(`^${wallet}$`, 'i') },
    });

    const competition = await Competition.findById(competitionId).select(
        'title startDate submissionDeadline votingDeadline status teamSize pptRequired prizePoolPOL numWinners'
    );

    if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

    if (!application) {
        return NextResponse.json({ competition, application: null, submission: null });
    }

    const submission = await Submission.findOne({ competitionId, teamId: application._id });

    return NextResponse.json({ competition, application, submission: submission || null });
}