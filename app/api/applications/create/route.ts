import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Application } from '@/models/Application';
import { Competition } from '@/models/Competition';

function generateTeamCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/applications/create — create a new team application
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { competitionId, teamName, member, pptUrl } = body;
        // member: { name, email, walletAddress, linkedinUrl, githubUrl }

        const competition = await Competition.findById(competitionId);
        if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

        if (new Date() > new Date(competition.applyDeadline))
            return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });

        // Check wallet not already in a team for this competition
        const existing = await Application.findOne({
            competitionId,
            'members.walletAddress': member.walletAddress.toLowerCase(),
        });
        if (existing) return NextResponse.json({ error: 'You already have a team for this competition' }, { status: 400 });

        // Check team name unique per competition
        const nameTaken = await Application.findOne({ competitionId, teamName });
        if (nameTaken) return NextResponse.json({ error: 'Team name already taken' }, { status: 400 });

        let teamCode = generateTeamCode();
        // Ensure unique code
        while (await Application.findOne({ teamCode })) {
            teamCode = generateTeamCode();
        }

        const application = await Application.create({
            competitionId,
            teamName,
            teamCode,
            members: [{ ...member, walletAddress: member.walletAddress.toLowerCase(), isLeader: true }],
            maxMembers: competition.teamSize,
            pptUrl: pptUrl || null,
            status: 'pending',
        });

        return NextResponse.json({ success: true, application }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}