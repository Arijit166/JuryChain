import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, name, profileImage, walletAddress } = await req.json();

        if (!walletAddress) {
            return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { walletAddress },
            { email, name, profileImage, walletAddress },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({ user }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}