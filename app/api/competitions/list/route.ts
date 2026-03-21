import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';

export async function GET() {
    try {
        await connectDB();
        const competitions = await Competition.find({ status: { $ne: 'draft' } })
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json({ competitions });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}