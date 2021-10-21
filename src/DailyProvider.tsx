import DailyIframe, {
  DailyCall,
  DailyCallOptions,
  DailyEvent,
  DailyEventObject,
} from '@daily-co/daily-js';
import React, { createContext, useCallback, useEffect, useRef } from 'react';
import { RecoilRoot } from 'recoil';

type DailyProperties = Pick<
  DailyCallOptions,
  | 'audioSource'
  | 'dailyConfig'
  | 'receiveSettings'
  | 'subscribeToTracksAutomatically'
  | 'token'
  | 'url'
  | 'videoSource'
>;

type Props =
  | DailyProperties
  | {
      callObject: DailyCall;
    };

export const DailyContext = createContext<DailyCall | null>(null);

interface EventContextValue {
  on(ev: DailyEvent, callback: Function): void;
  off(ev: DailyEvent, callback: Function): void;
}

type EventsMap = Partial<Record<DailyEvent, Set<Function>>>;

export const DailyEventContext = createContext<EventContextValue>({
  on: () => {},
  off: () => {},
});

export const DailyProvider: React.FC<Props> = ({ children, ...props }) => {
  const callObject = useRef<DailyCall | null>(
    'callObject' in props ? props.callObject : null
  );
  const eventsMap = useRef<EventsMap>({});

  /**
   * Generic event handler to loop through registered event callbacks.
   */
  const handleEvent = useCallback((ev: DailyEventObject) => {
    if (!('action' in ev)) return;
    const event = ev.action as DailyEvent;
    eventsMap.current?.[event]?.forEach((cb) => {
      cb(ev);
    });
  }, []);

  /**
   * In case events are setup via useDailyEvent before a DailyCall instance is available,
   * we'll register the events whenever daily is set.
   */
  const initEventHandlers = useCallback(
    (daily: DailyCall) => {
      if (!daily) return;
      (Object.keys(eventsMap.current) as DailyEvent[]).forEach((event) => {
        // @ts-ignore
        const events = daily._events as Record<
          DailyEvent,
          Function | Function[]
        >;
        if (
          (typeof events[event] === 'function' &&
            events[event] !== handleEvent) ||
          (Array.isArray(events[event]) &&
            !(events[event] as Function[]).includes(handleEvent))
        ) {
          daily.on(event as DailyEvent, handleEvent);
        }
      });
    },
    [handleEvent]
  );

  useEffect(() => {
    if ('callObject' in props) {
      callObject.current = props.callObject;
      initEventHandlers(props.callObject);
      return;
    }
    const co = DailyIframe.createCallObject(props);
    callObject.current = co;
    initEventHandlers(co);
  }, [initEventHandlers, props]);

  /**
   * Registers event callback.
   */
  const on = useCallback(
    (ev: DailyEvent, cb: Function) => {
      if (!eventsMap.current[ev]) {
        eventsMap.current[ev] = new Set();
        if (callObject.current) {
          callObject.current?.on(ev, handleEvent);
        }
      }
      eventsMap.current[ev]?.add(cb);
    },
    [handleEvent]
  );

  /**
   * Unregisters event callback.
   */
  const off = useCallback(
    (ev: DailyEvent, cb: Function) => {
      eventsMap.current[ev]?.delete(cb);
      if (eventsMap.current[ev]?.size === 0) {
        if (callObject.current) {
          callObject.current?.off(ev, handleEvent);
        }
        delete eventsMap.current[ev];
      }
    },
    [handleEvent]
  );

  return (
    <RecoilRoot>
      <DailyContext.Provider value={callObject.current}>
        <DailyEventContext.Provider value={{ on, off }}>
          {children}
        </DailyEventContext.Provider>
      </DailyContext.Provider>
    </RecoilRoot>
  );
};
