import deployed from './deployedContract.json';

export const CONTRACT_ADDRESS = deployed.address as `0x${string}`;
export const CONTRACT_ABI = deployed.abi;

// Merkle root builder (client-side, no heavy libs needed for dev)
// For production use @openzeppelin/merkle-tree

/** Build Merkle tree from already-hashed bytes32 leaves */
function buildMerkleTreeFromLeaves(leaves: string[]): string {
    if (leaves.length === 0) return '0x' + '0'.repeat(64);
    const { keccak256, solidityPacked } = require('ethers');

    let layer = [...leaves];
    while (layer.length > 1) {
        const next: string[] = [];
        for (let i = 0; i < layer.length; i += 2) {
            if (i + 1 < layer.length) {
                const [a, b] = [layer[i], layer[i + 1]].sort();
                next.push(keccak256(solidityPacked(['bytes32', 'bytes32'], [a, b])));
            } else {
                next.push(layer[i]);
            }
        }
        layer = next;
    }
    return layer[0];
}

/** Build Merkle root from wallet judge addresses (hashes each as address leaf) */
export function buildJudgeMerkleRoot(judgeAddresses: string[]): string {
    if (judgeAddresses.length === 0) return '0x' + '0'.repeat(64);
    const { keccak256, solidityPacked } = require('ethers');
    const leaves = judgeAddresses.map((addr) =>
        keccak256(solidityPacked(['address'], [addr]))
    );
    return buildMerkleTreeFromLeaves(leaves);
}

export function buildMerkleRootFromJudges(
    judges: Array<{ type: 'wallet' | 'email'; value: string }>
): string {
    if (judges.length === 0) return '0x' + '0'.repeat(64);

    const { keccak256, solidityPacked, toUtf8Bytes } = require('ethers');

    // Convert each judge to a bytes32 leaf using the correct encoding per type
    const leaves = judges.map((j) => {
        if (j.type === 'wallet') {
            // Encode as address (20 bytes), then hash
            return keccak256(solidityPacked(['address'], [j.value]));
        } else {
            // Encode email as UTF-8 bytes, then hash
            return keccak256(toUtf8Bytes(j.value));
        }
    });

    return buildMerkleTreeFromLeaves(leaves);
}