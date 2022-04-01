import DailyIframe, {
  DailyCall,
  DailyCallOptions,
  DailyEvent,
  DailyEventObject,
} from '@daily-co/daily-js';
import React, { useCallback, useEffect, useRef } from 'react';
import { RecoilRoot } from 'recoil';

import { DailyContext } from './DailyContext';
import { DailyEventContext } from './DailyEventContext';
import { DailyRoom } from './DailyRoom';

type DailyProperties = Pick<
  DailyCallOptions,
  | 'audioSource'
  | 'dailyConfig'
  | 'receiveSettings'
  | 'subscribeToTracksAutomatically'
  | 'token'
  | 'url'
  | 'userName'
  | 'videoSource'
>;

type Props =
  | DailyProperties
  | {
      callObject: DailyCall;
    };

type EventsMap = Partial<Record<DailyEvent, Map<number, Function>>>;

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
    const callbacks = Array.from(eventsMap.current?.[event]?.values() ?? []);
    callbacks.forEach((cb) => {
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
        daily
          .off(event as DailyEvent, handleEvent)
          .on(event as DailyEvent, handleEvent);
      });
    },
    [handleEvent]
  );

  useEffect(() => {
    if (callObject.current) return;
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
    (ev: DailyEvent, cb: Function, key: number) => {
      if (!eventsMap.current[ev]) {
        eventsMap.current[ev] = new Map();
        if (callObject.current) {
          callObject.current?.on(ev, handleEvent);
        }
      }
      if (!eventsMap.current[ev]?.has(key)) {
        eventsMap.current[ev]?.set(key, cb);
      }
    },
    [handleEvent]
  );

  /**
   * Unregisters event callback.
   */
  const off = useCallback(
    (ev: DailyEvent, key: number) => {
      eventsMap.current[ev]?.delete(key);
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
          <DailyRoom>{children}</DailyRoom>
        </DailyEventContext.Provider>
      </DailyContext.Provider>
    </RecoilRoot>
  );
};
