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

  useEffect(() => {
    if ('callObject' in props) {
      callObject.current = props.callObject;
      return;
    }
    const co = DailyIframe.createCallObject(props);
    callObject.current = co;
  }, [props]);

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
   * Registers event callback.
   */
  const on = useCallback(
    (ev: DailyEvent, cb: Function) => {
      if (!callObject.current) return;
      if (!eventsMap.current[ev]) {
        eventsMap.current[ev] = new Set();
        callObject.current.on(ev, handleEvent);
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
      if (!callObject.current) return;
      eventsMap.current[ev]?.delete(cb);
      if (eventsMap.current[ev]?.size === 0) {
        callObject.current.off(ev, handleEvent);
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
