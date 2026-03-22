import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase();
        if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

        const competitions = await Competition.find({ sponsorWallet: wallet })
            .sort({ createdAt: -1 }).lean();

        return NextResponse.json({ competitions });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}