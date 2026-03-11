export const TaskStatusEnum = {
    TODO: "TODO",
    BACKLOG: "BACKLOG",
    INREVIEW: "INREVIEW",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    DONE: "DONE",
} as const;

export const TaskPriorityEnum = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
} as const;

export type TaskStatusEnumType = keyof typeof TaskStatusEnum;
export type TaskPriorityEnumType = keyof typeof TaskPriorityEnum;