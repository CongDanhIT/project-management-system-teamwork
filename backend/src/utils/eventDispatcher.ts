import { EventEmitter } from "events";

/**
 * Trung tâm điều phối sự kiện nội bộ của Backend.
 * Dùng để tách biệt logic nghiệp vụ và các side-effects (như Socket.io, Email, Slack).
 */
class EventDispatcher extends EventEmitter {}

const eventDispatcher = new EventDispatcher();

// Định nghĩa các hằng số sự kiện để tránh typo
export const EVENTS = {
    TASK: {
        CREATED: "task:created",
        UPDATED: "task:updated",
        DELETED: "task:deleted",
        MOVED: "task:moved",
    },
    PROJECT: {
        UPDATED: "project:updated",
        FROZEN: "project:frozen",
    },
    ANNOUNCEMENT: {
        CREATED: "announcement:created",
        UPDATED: "announcement:updated",
        DELETED: "announcement:deleted",
        PINNED: "announcement:pinned",
        INTERACTION: "announcement:interaction", // Dùng cho comment/reaction trên newsfeed
    },
    COMMENT: {
        ADDED: "comment:added",
        DELETED: "comment:deleted",
        REACTION_UPDATED: "comment:reaction_updated",
    },
    NOTIFICATION: {
        RECEIVED: "notification:received",
    }
};

export default eventDispatcher;
