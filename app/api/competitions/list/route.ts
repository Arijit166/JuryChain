import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';
import { Application } from '@/models/Application';

export async function GET() {
    try {
        await connectDB();
        const competitions = await Competition.find({ status: { $ne: 'draft' } })
            .sort({ createdAt: -1 })
            .lean();

        // Auto-reject pending applications for competitions that have started
        const now = new Date();
        const startedIds = competitions
            .filter(c => new Date(c.startDate) <= now)
            .map(c => c._id);

        if (startedIds.length > 0) {
            await Application.updateMany(
                {
                    competitionId: { $in: startedIds },
                    status: 'pending',
                    lockedAt: { $ne: null }, // only submitted teams
                },
                { $set: { status: 'rejected' } }
            );
        }

        return NextResponse.json({ competitions });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}