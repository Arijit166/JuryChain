import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IMember {
    name: string;
    email: string;
    walletAddress: string;
    linkedinUrl: string;
    githubUrl: string;
    isLeader: boolean;
}

export interface IApplication extends Document {
    competitionId: mongoose.Types.ObjectId;
    teamName: string;
    teamCode: string;
    members: IMember[];
    maxMembers: number;
    pptUrl: string | null;
    category: string;
    status: 'pending' | 'accepted' | 'rejected';
    appliedAt: Date;
    lockedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const MemberSchema = new Schema<IMember>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    walletAddress: { type: String, required: true },
    linkedinUrl: { type: String, required: true },
    githubUrl: { type: String, required: true },
    isLeader: { type: Boolean, default: false },
});

const ApplicationSchema = new Schema<IApplication>(
    {
        competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
        teamName: { type: String, required: true },
        teamCode: { type: String, required: true, unique: true },
        members: [MemberSchema],
        maxMembers: { type: Number, required: true },
        pptUrl: { type: String, default: null },
        category: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        appliedAt: { type: Date, default: null },
        lockedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const Application = models.Application || model<IApplication>('Application', ApplicationSchema);