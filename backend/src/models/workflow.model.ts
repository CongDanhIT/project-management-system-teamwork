import mongoose, { Schema, model } from "mongoose";

export interface WorkflowDocument extends mongoose.Document {
    name: string;
    description?: string;
    projectId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    isActive: boolean;
    nodes: any[];
    edges: any[];
    createdAt: Date;
    updatedAt: Date;
}

const workflowSchema = new Schema<WorkflowDocument>({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },
    isActive: { type: Boolean, default: true },
    nodes: { type: Schema.Types.Mixed, default: [] },
    edges: { type: Schema.Types.Mixed, default: [] }
}, {
    timestamps: true
});

const WorkflowModel = model<WorkflowDocument>("Workflow", workflowSchema);
export default WorkflowModel;
