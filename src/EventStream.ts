import { EventEmitter } from "events";

type EventPayload = any;
type EventListener<T = EventPayload> = (payload: T) => void | Promise<void>;

class EventStream extends EventEmitter {
  constructor() {
    super();

    this.setMaxListeners(50);

    this.on("error", (err: unknown) => {
      console.error( err);
    });
  }

  emitEvent<T = EventPayload>(event: string, payload: T): void {
    try {
      this.emit(event, payload);
    } catch (err: any) {
      this.emit("error", ` ${err.message}`);
    }
  }

  onEvent<T = EventPayload>(
    event: string,
    listener: EventListener<T>
  ): void {
    this.on(event, async (payload: T) => {
      try {
        await listener(payload);
      } catch (err: any) {
        this.emit("error", ` ${err.message}`);
      }
    });
  }

  onceEvent<T = EventPayload>(
    event: string,
    listener: EventListener<T>
  ): void {
    this.once(event, listener);
  }
}

const eventStream = new EventStream();

export { EventStream };
export default eventStream;
