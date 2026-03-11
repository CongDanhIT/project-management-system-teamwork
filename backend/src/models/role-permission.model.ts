import mongoose, { Schema, model } from "mongoose";
import { RolePermissions } from "../utils/role-permission";
import { PermissionEnumType, RoleEnum, RoleEnumType, Permissions } from "../enums/role.enum";
export interface RoleDocument extends mongoose.Document {
    name: RoleEnumType;
    permission: Array<PermissionEnumType>;
}
const rolePermissionSchema = new Schema<RoleDocument>({
    name: {
        type: String,
        enum: Object.values(RoleEnum),
        required: true,
        unique: true
    },
    permission: {
        type: [String],
        required: true,
        enum: Object.values(Permissions),
        default: function () {
            return RolePermissions[this.name];
        }
    }

}, {
    timestamps: true
});
const RoleModel = model<RoleDocument>("Role", rolePermissionSchema);
export default RoleModel;