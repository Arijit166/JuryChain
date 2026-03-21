import deployed from './deployedContract.json';

export const CONTRACT_ADDRESS = deployed.address as `0x${string}`;
export const CONTRACT_ABI = deployed.abi;

// Merkle root builder (client-side, no heavy libs needed for dev)
// For production use @openzeppelin/merkle-tree
export function buildJudgeMerkleRoot(judgeAddresses: string[]): string {
    if (judgeAddresses.length === 0) return '0x' + '0'.repeat(64);

    // Simple deterministic hash tree for dev
    // Replace with @openzeppelin/merkle-tree in production
    const { keccak256, encodePacked } = require('ethers');

    let leaves = judgeAddresses.map((addr) =>
        keccak256(encodePacked(['address'], [addr]))
    );

    while (leaves.length > 1) {
        const next: string[] = [];
        for (let i = 0; i < leaves.length; i += 2) {
            if (i + 1 < leaves.length) {
                // Sort to make tree deterministic
                const [a, b] = [leaves[i], leaves[i + 1]].sort();
                next.push(keccak256(encodePacked(['bytes32', 'bytes32'], [a, b])));
            } else {
                next.push(leaves[i]);
            }
        }
        leaves = next;
    }

    return leaves[0];
}

export function buildMerkleRootFromJudges(
    judges: Array<{ type: 'wallet' | 'email'; value: string }>
): string {
    // Only wallet addresses go on-chain; email judges are off-chain commitments
    const walletJudges = judges
        .filter((j) => j.type === 'wallet')
        .map((j) => j.value);

    if (walletJudges.length === 0) {
        // If all email judges, hash their emails as bytes32 commitment
        const { keccak256, toUtf8Bytes } = require('ethers');
        const emailHashes = judges.map((j) => keccak256(toUtf8Bytes(j.value)));
        return buildJudgeMerkleRoot(emailHashes);
    }

    return buildJudgeMerkleRoot(walletJudges);
}