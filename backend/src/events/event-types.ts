export const EventTypes = {
  NEW_ANNOUNCEMENT: 'NEW_ANNOUNCEMENT',
  DELETE_ANNOUNCEMENT: 'DELETE_ANNOUNCEMENT',
  PIN_ANNOUNCEMENT: 'PIN_ANNOUNCEMENT',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
