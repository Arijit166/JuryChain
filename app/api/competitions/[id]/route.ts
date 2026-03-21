import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const competition = await Competition.findById(id).lean();
        if (!competition) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ competition });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}