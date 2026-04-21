export const EventTypes = {
  NEW_ANNOUNCEMENT: 'NEW_ANNOUNCEMENT',
  DELETE_ANNOUNCEMENT: 'DELETE_ANNOUNCEMENT',
  PIN_ANNOUNCEMENT: 'PIN_ANNOUNCEMENT',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
