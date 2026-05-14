import mongoose, { Schema, model } from "mongoose";

export interface MemberDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    role: mongoose.Types.ObjectId;
    joinedAt: Date;
}
const memberSchema = new Schema<MemberDocument>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    joinedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Thêm Unique Composite Index tại đây
memberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const MemberModel = model<MemberDocument>("Member", memberSchema);
export default MemberModel;