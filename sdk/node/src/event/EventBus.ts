import { EventEmitter } from 'events';
import { Realm } from '../realm/Realm';
import { EventPublisher } from '../types';

interface EventSubscription {
  capability: string;
  eventName: string;
  topic: string;
  handler: (payload: any) => Promise<void>;
  filters?: Record<string, any>;
}

interface IncomingEvent {
  capability: string;
  eventName: string;
  topic: string;
  payload: any;
}

export class EventBus extends EventEmitter {
  private subscriptions: EventSubscription[] = [];

  constructor(private realm: Realm) {
    super();
  }

  async start(): Promise<void> {
    console.log('Event bus started');
  }

  async stop(): Promise<void> {
    console.log('Event bus stopped');
  }

  subscribe(subscription: EventSubscription): void {
    this.subscriptions.push(subscription);

    // Send subscription to gateway
    this.realm.getBridgeManager().send({
      type: 'event-subscribe',
      payload: {
        capability: subscription.capability,
        eventName: subscription.eventName,
        topic: subscription.topic,
        filters: subscription.filters
      }
    });
  }

  async handleIncomingEvent(event: IncomingEvent): Promise<void> {
    const matchingSubscriptions = this.subscriptions.filter(sub =>
      sub.capability === event.capability &&
      sub.eventName === event.eventName &&
      sub.topic === event.topic &&
      this.matchesFilters(event.payload, sub.filters)
    );

    // Execute all matching handlers
    await Promise.all(
      matchingSubscriptions.map(sub =>
        sub.handler(event.payload).catch(error =>
          console.error('Event handler error:', error)
        )
      )
    );
  }

  private matchesFilters(payload: any, filters?: Record<string, any>): boolean {
    if (!filters) return true;

    for (const [key, value] of Object.entries(filters)) {
      if (payload[key] !== value) return false;
    }

    return true;
  }

  createPublisher<T>(capability: string, eventName: string, topic: string): EventPublisher<T> {
    return {
      publish: async (payload: T) => {
        await this.realm.getBridgeManager().publishEvent(
          capability,
          eventName,
          topic,
          payload
        );
      },
      publishWithHeaders: async (payload: T, headers: Record<string, string>) => {
        await this.realm.getBridgeManager().publishEvent(
          capability,
          eventName,
          topic,
          { ...payload, _headers: headers }
        );
      }
    };
  }
}