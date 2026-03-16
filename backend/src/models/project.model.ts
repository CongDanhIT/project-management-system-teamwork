import mongoose, { Schema, model } from "mongoose";

export interface ProjectDocument extends mongoose.Document {
    name: string;
    description: string | null;
    emoji: string;
    workspaceId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
const projectSchema = new Schema<ProjectDocument>({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
    emoji: { type: String, required: false, trim: true, default: "🎯" },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: true,
});

projectSchema.index({ workspaceId: 1, _id: 1 });

const ProjectModel = model<ProjectDocument>("Project", projectSchema);

export default ProjectModel;