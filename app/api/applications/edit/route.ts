import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Application } from '@/models/Application';

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const { teamCode, walletAddress, teamName, pptUrl } = await req.json();

        const application = await Application.findOne({ teamCode: teamCode.toUpperCase() });
        if (!application) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        if (application.lockedAt) return NextResponse.json({ error: 'Application already submitted — cannot edit' }, { status: 400 });

        const isLeader = application.members.some(
            (m: any) => m.walletAddress === walletAddress.toLowerCase() && m.isLeader
        );
        if (!isLeader) return NextResponse.json({ error: 'Only team leader can edit' }, { status: 403 });

        if (teamName) application.teamName = teamName;
        if (pptUrl) application.pptUrl = pptUrl;
        await application.save();

        return NextResponse.json({ success: true, application });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}