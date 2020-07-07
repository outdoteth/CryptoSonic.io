import {EventEmitter} from 'events';

class EventsEmitter extends EventEmitter {}

const Events = new EventsEmitter();
export = Events;

