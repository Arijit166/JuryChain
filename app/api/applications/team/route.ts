import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Application } from '@/models/Application';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const application = await Application.findById(id).lean();
        return NextResponse.json({ application: application || null });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}