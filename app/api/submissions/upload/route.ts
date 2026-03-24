import { NextRequest, NextResponse } from 'next/server';

// Expects multipart/form-data with a field named "file"
export async function POST(req: NextRequest) {
    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
        return NextResponse.json({ error: 'IPFS upload not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const pinataForm = new FormData();
    pinataForm.append('file', file);
    pinataForm.append('pinataMetadata', JSON.stringify({ name: file.name }));
    pinataForm.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pinataJwt}` },
        body: pinataForm,
    });

    if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Pinata error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const ipfsHash = data.IpfsHash;
    const fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return NextResponse.json({ ipfsHash, fileUrl });
}