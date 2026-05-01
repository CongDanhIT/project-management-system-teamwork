import mongoose, { Schema, model, Document } from "mongoose";

export interface PhaseDocument extends Document {
    workspaceId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    isLocked: boolean;
    createdBy: mongoose.Types.ObjectId;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const phaseSchema = new Schema<PhaseDocument>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        isLocked: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Tối ưu truy vấn tìm phase theo dự án
phaseSchema.index({ projectId: 1, deletedAt: 1 });
phaseSchema.index({ workspaceId: 1 });

const PhaseModel = model<PhaseDocument>("Phase", phaseSchema);

export default PhaseModel;
