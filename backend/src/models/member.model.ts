import mongoose, { Schema, model } from "mongoose";

export interface MemberDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    workspaceID: mongoose.Types.ObjectId;
    role: mongoose.Types.ObjectId;
    joinedAt: Date;
}
const memberSchema = new Schema<MemberDocument>({
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    workspaceID: { type: mongoose.Types.ObjectId, ref: "Workspace", required: true },
    role: { type: mongoose.Types.ObjectId, ref: "Role", required: true },
    joinedAt: { type: Date, default: Date.now }
}, {
    timestamps: true

});
const MemberModel = model<MemberDocument>("Member", memberSchema);
export default MemberModel;