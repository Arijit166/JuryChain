import { Schema, Document, model, models } from 'mongoose';
import mongoose from 'mongoose';

export interface ISubmission extends Document {
    competitionId: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;       // Application._id
    teamName: string;
    submittedBy: string;                   // walletAddress of member who last submitted
    projectTitle: string;
    description: string;
    repoUrl: string;
    demoUrl: string;
    ipfsHash: string | null;               // CID of uploaded file (if any)
    fileUrl: string | null;               // Gateway URL or manual URL
    additionalLinks: string[];
    createdAt: Date;
    updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
    {
        competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
        teamId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
        teamName: { type: String, required: true },
        submittedBy: { type: String, required: true },
        projectTitle: { type: String, required: true },
        description: { type: String, required: true },
        repoUrl: { type: String, default: '' },
        demoUrl: { type: String, default: '' },
        ipfsHash: { type: String, default: null },
        fileUrl: { type: String, default: null },
        additionalLinks: [{ type: String }],
    },
    { timestamps: true }
);

// One submission per team per competition
SubmissionSchema.index({ competitionId: 1, teamId: 1 }, { unique: true });

export const Submission = models.Submission || model<ISubmission>('Submission', SubmissionSchema);