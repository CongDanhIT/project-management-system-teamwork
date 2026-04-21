import { EventEmitter } from 'events';

class AppEventDispatcher extends EventEmitter {}

export const eventDispatcher = new AppEventDispatcher();
