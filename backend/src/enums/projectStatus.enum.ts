export const ProjectStatusEnum = {
    PLANNING: "PLANNING",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    ON_HOLD: "ON_HOLD",
    FROZEN: "FROZEN",
} as const;
export type ProjectStatusEnumType = typeof ProjectStatusEnum[keyof typeof ProjectStatusEnum];
