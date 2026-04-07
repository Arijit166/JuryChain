import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IVote extends Document {
    competitionId: mongoose.Types.ObjectId;
    submissionId: mongoose.Types.ObjectId;
    nullifierHash: string;
    judgeWallet?: string;
    judgeEmail?: string;
    commitmentKey: string;
    score: number;
    createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
    {
        competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true, index: true },
        submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
        nullifierHash: { type: String, required: true, unique: true },
        judgeWallet: { type: String, default: null },
        judgeEmail: { type: String, default: null },
        commitmentKey: { type: String, required: true, index: true },
        score: { type: Number, required: true, min: 1, max: 10 },
    },
    { timestamps: true }
);

VoteSchema.index({ competitionId: 1, submissionId: 1 });

export const Vote = models.Vote || model<IVote>('Vote', VoteSchema);