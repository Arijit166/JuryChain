import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Application } from '@/models/Application';
import { Competition } from '@/models/Competition';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { teamCode, member } = await req.json();

        const application = await Application.findOne({ teamCode: teamCode.toUpperCase() });
        if (!application) return NextResponse.json({ error: 'Invalid team code' }, { status: 404 });
        if (application.lockedAt) return NextResponse.json({ error: 'Team has already submitted — no new members allowed' }, { status: 400 });
        if (application.members.length >= application.maxMembers)
            return NextResponse.json({ error: 'Team is full' }, { status: 400 });

        const competition = await Competition.findById(application.competitionId);
        if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
        if (new Date() > new Date(competition.applyDeadline))
            return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });

        // Check not already in any team for this competition
        const alreadyIn = await Application.findOne({
            competitionId: application.competitionId,
            'members.walletAddress': member.walletAddress.toLowerCase(),
        });
        if (alreadyIn) return NextResponse.json({ error: 'You are already in a team for this competition' }, { status: 400 });

        application.members.push({ ...member, walletAddress: member.walletAddress.toLowerCase(), isLeader: false });
        await application.save();

        return NextResponse.json({ success: true, application });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}