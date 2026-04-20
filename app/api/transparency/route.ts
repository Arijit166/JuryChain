import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/models/Competition';
import { Vote } from '@/models/Vote';
import { Submission } from '@/models/Submission';

export async function GET() {
    try {
        await connectDB();

        const [competitions, votes, submissions] = await Promise.all([
            Competition.find({ status: { $ne: 'draft' } })
                .sort({ createdAt: -1 })
                .lean(),
            Vote.find({})
                .sort({ createdAt: -1 })
                .lean(),
            Submission.find({})
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        // Format competitions
        const competitionRecords = competitions.map((c: any) => ({
            id: c._id.toString(),
            type: 'competition',
            title: c.title,
            timestamp: new Date(c.createdAt).toUTCString(),
            hash: c.txHash || c.judgeMerkleRoot || c._id.toString(),
            status: c.txHash ? 'verified' : 'pending',
            link: `/competition/${c._id.toString()}`,
            meta: {
                prizePool: c.prizePool,
                category: c.category,
                venue: c.venue,
            },
        }));

        // Format votes
        const voteRecords = votes.map((v: any) => ({
            id: v._id.toString(),
            type: 'vote',
            title: `Judge Vote Commitment`,
            timestamp: new Date(v.createdAt).toUTCString(),
            hash: v.nullifierHash || v.commitmentKey,
            status: 'verified',
            link: null,
            meta: {
                score: v.score,
                competitionId: v.competitionId?.toString(),
            },
        }));

        // Format submissions as proof records
        const proofRecords = submissions.map((s: any) => ({
            id: s._id.toString(),
            type: 'proof',
            title: `Submission: ${s.projectTitle}`,
            timestamp: new Date(s.createdAt).toUTCString(),
            hash: s.ipfsHash || s._id.toString(),
            status: s.ipfsHash ? 'verified' : 'pending',
            link: null,
            meta: {
                teamName: s.teamName,
                competitionId: s.competitionId?.toString(),
            },
        }));

        return NextResponse.json({
            competitions: competitionRecords,
            votes: voteRecords,
            proofs: proofRecords,
            transactions: [], // future: on-chain tx records
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
