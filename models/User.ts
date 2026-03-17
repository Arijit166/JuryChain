import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name?: string;
    profileImage?: string;
    walletAddress: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true },
        name: { type: String },
        profileImage: { type: String },
        walletAddress: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

export const User = models.User || model<IUser>('User', UserSchema);