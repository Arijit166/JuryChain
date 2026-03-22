import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Application } from '@/models/Application';

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const { teamCode, walletAddress, name, email, linkedinUrl, githubUrl } = await req.json();

        const application = await Application.findOne({ teamCode: teamCode.toUpperCase() });
        if (!application) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        if (application.lockedAt) return NextResponse.json({ error: 'Application submitted — cannot edit' }, { status: 400 });

        const memberIndex = application.members.findIndex(
            (m: any) => m.walletAddress === walletAddress.toLowerCase()
        );
        if (memberIndex === -1) return NextResponse.json({ error: 'Member not found in team' }, { status: 404 });

        // Only update own details — never touch isLeader or other members
        if (name) application.members[memberIndex].name = name;
        if (email) application.members[memberIndex].email = email;
        if (linkedinUrl) application.members[memberIndex].linkedinUrl = linkedinUrl;
        if (githubUrl) application.members[memberIndex].githubUrl = githubUrl;

        application.markModified('members');
        await application.save();

        return NextResponse.json({ success: true, application });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}