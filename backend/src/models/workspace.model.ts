import mongoose, { Schema, model } from "mongoose";
import { generateInviteCode } from "../utils/uuid";

export interface WorkspaceDocument extends mongoose.Document {
    name: string;
    description?: string | null;
    owner: mongoose.Types.ObjectId;
    inviteCode: string;
    slackWebhookUrl?: string | null;
    dailyDigestEnabled: boolean;
    activeCall?: {
        roomName: string;
        startedBy: mongoose.Types.ObjectId;
        startTime: Date;
    } | null;
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
    slackWebhookUrl: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    dailyDigestEnabled: {
        type: Boolean,
        default: true
    },
    activeCall: {
        type: {
            roomName: { type: String, required: true },
            startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
            startTime: { type: Date, default: Date.now }
        },
        default: null,
        required: false
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