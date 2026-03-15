import mongoose, { Schema, model } from "mongoose";
import { generateInviteCode } from "../utils/uuid";

export interface WorkspaceDocument extends mongoose.Document {
    name: string;
    description?: string | null;
    owner: mongoose.Types.ObjectId;
    inviteCode: string;
    createdAt: Date;
    updatedAt: Date;
    resetInviteCode(): void;
}
const workspaceSchema = new Schema<WorkspaceDocument>({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    inviteCode: {
        type: String,
        required: true,
        unique: true,
        default: generateInviteCode,
    },
},
    {
        timestamps: true,
    })
workspaceSchema.methods.resetInviteCode = function (): void {
    this.inviteCode = generateInviteCode();
}

const WorkspaceModel = model<WorkspaceDocument>("Workspace", workspaceSchema);

export default WorkspaceModel;