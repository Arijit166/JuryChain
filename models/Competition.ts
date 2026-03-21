import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ICompetition extends Document {
    title: string;
    description: string;
    prizePool: string;           // stored as string (wei amount from contract)
    prizePoolUSD: number;        // human-readable amount sponsor typed
    numWinners: number;
    submissionDeadline: Date;
    votingDeadline: Date;
    judges: Array<{ type: 'wallet' | 'email'; value: string }>;
    judgeMerkleRoot: string;     // bytes32 from contract
    isPublic: boolean;
    sponsorWallet: string;
    contractCompetitionId: number | null;  // on-chain ID, set after tx confirms
    txHash: string | null;
    status: 'draft' | 'pending_tx' | 'live' | 'voting' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

const CompetitionSchema = new Schema<ICompetition>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        prizePool: { type: String, required: true },
        prizePoolUSD: { type: Number, required: true },
        numWinners: { type: Number, required: true },
        submissionDeadline: { type: Date, required: true },
        votingDeadline: { type: Date, required: true },
        judges: [
            {
                type: { type: String, enum: ['wallet', 'email'], required: true },
                value: { type: String, required: true },
            },
        ],
        judgeMerkleRoot: { type: String, required: true },
        isPublic: { type: Boolean, default: true },
        sponsorWallet: { type: String, required: true },
        contractCompetitionId: { type: Number, default: null },
        txHash: { type: String, default: null },
        status: {
            type: String,
            enum: ['draft', 'pending_tx', 'live', 'voting', 'completed'],
            default: 'pending_tx',
        },
    },
    { timestamps: true }
);

export const Competition = models.Competition || model<ICompetition>('Competition', CompetitionSchema);