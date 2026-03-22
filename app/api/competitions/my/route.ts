import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';
import { Application } from '@/models/Application';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase();
        if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

        const competitions = await Competition.find({ sponsorWallet: wallet })
            .sort({ createdAt: -1 }).lean();

        // Auto-reject pending applications for started competitions
        const now = new Date();
        const startedIds = competitions
            .filter(c => new Date(c.startDate) <= now)
            .map(c => c._id);

        if (startedIds.length > 0) {
            await Application.updateMany(
                {
                    competitionId: { $in: startedIds },
                    status: 'pending',
                    lockedAt: { $ne: null },
                },
                { $set: { status: 'rejected' } }
            );
        }

        return NextResponse.json({ competitions });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}