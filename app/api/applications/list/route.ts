import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Application } from '@/models/Application';
import { Competition } from '@/models/Competition';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const competitionId = req.nextUrl.searchParams.get('competitionId');
        const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase();

        if (!competitionId || !wallet) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

        const competition = await Competition.findById(competitionId);
        if (!competition) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (competition.sponsorWallet !== wallet)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const applications = await Application.find({ competitionId }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ applications });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}