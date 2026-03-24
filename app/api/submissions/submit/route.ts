import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Submission } from '@/models/Submission';
import { Application } from '@/models/Application';
import { Competition } from '@/models/Competition';

export async function POST(req: NextRequest) {
    await connectDB();
    const body = await req.json();
    const { competitionId, walletAddress, projectTitle, description, repoUrl, demoUrl, ipfsHash, fileUrl, additionalLinks } = body;

    if (!competitionId || !walletAddress || !projectTitle || !description) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify competition exists and submission window is open
    const competition = await Competition.findById(competitionId);
    if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

    const now = new Date();
    if (now < new Date(competition.startDate)) {
        return NextResponse.json({ error: 'Competition has not started yet' }, { status: 403 });
    }
    if (now > new Date(competition.submissionDeadline)) {
        return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 403 });
    }

    // Verify the wallet belongs to an accepted team in this competition
    const application = await Application.findOne({
        competitionId,
        status: 'accepted',
        'members.walletAddress': { $regex: new RegExp(`^${walletAddress}$`, 'i') },
    });
    if (!application) {
        return NextResponse.json({ error: 'No accepted application found for your wallet in this competition' }, { status: 403 });
    }

    // Upsert submission (one per team)
    const submission = await Submission.findOneAndUpdate(
        { competitionId, teamId: application._id },
        {
            teamName: application.teamName,
            submittedBy: walletAddress,
            projectTitle,
            description,
            repoUrl: repoUrl || '',
            demoUrl: demoUrl || '',
            ipfsHash: ipfsHash || null,
            fileUrl: fileUrl || null,
            additionalLinks: additionalLinks || [],
        },
        { upsert: true, new: true }
    );

    return NextResponse.json({ submission });
}