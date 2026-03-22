import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Application } from '@/models/Application';
import { Competition } from '@/models/Competition';

// GET — check if a wallet has applied to a competition
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const competitionId = req.nextUrl.searchParams.get('competitionId');
        const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase();
        if (!competitionId || !wallet) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

        const application = await Application.findOne({
            competitionId,
            'members.walletAddress': wallet,
        }).lean();

        return NextResponse.json({ application: application || null });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH — accept or reject
export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const { applicationId, action, wallet } = await req.json();
        // action: 'accepted' | 'rejected'

        const application = await Application.findById(applicationId);
        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const competition = await Competition.findById(application.competitionId);
        if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
        if (competition.sponsorWallet !== wallet.toLowerCase())
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        application.status = action;
        await application.save();

        return NextResponse.json({ success: true, application });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}