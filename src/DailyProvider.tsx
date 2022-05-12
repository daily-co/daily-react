import DailyIframe, {
  DailyCall,
  DailyCallOptions,
  DailyEvent,
  DailyEventObject,
} from '@daily-co/daily-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RecoilRoot } from 'recoil';

import { DailyContext } from './DailyContext';
import { DailyEventContext } from './DailyEventContext';
import { DailyParticipants } from './DailyParticipants';
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

export const DailyProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  ...props
}) => {
  const [callObject, setCallObject] = useState<DailyCall | null>(
    'callObject' in props ? props.callObject : null
  );
  const eventsMap = useRef<EventsMap>({});

  /**
   * Generic event handler to loop through registered event callbacks.
   */
  const handleEvent = useCallback((ev: DailyEventObject) => {
    if (!('action' in ev)) return;
    const event = ev.action as DailyEvent;
    for (let cb of eventsMap.current?.[event]?.values() ?? []) {
      cb(ev);
    }
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
    if (callObject) return;
    if ('callObject' in props) {
      setCallObject(props.callObject);
      initEventHandlers(props.callObject);
      return;
    }
    const co = DailyIframe.createCallObject(props);
    setCallObject(co);
    initEventHandlers(co);
  }, [callObject, initEventHandlers, props]);

  /**
   * Registers event callback.
   */
  const on = useCallback(
    (ev: DailyEvent, cb: Function, key: number) => {
      if (!eventsMap.current[ev]) {
        eventsMap.current[ev] = new Map();
        if (callObject) {
          /**
           * Make sure only 1 event listener is registered at anytime for handleEvent.
           * Otherwise events sent from daily-js might be handled multiple times.
           */
          callObject.off(ev, handleEvent).on(ev, handleEvent);
        }
      }
      if (!eventsMap.current[ev]?.has(key)) {
        eventsMap.current[ev]?.set(key, cb);
      }
    },
    [callObject, handleEvent]
  );

  /**
   * Unregisters event callback.
   */
  const off = useCallback(
    (ev: DailyEvent, key: number) => {
      eventsMap.current[ev]?.delete(key);
      if (eventsMap.current[ev]?.size === 0) {
        callObject?.off(ev, handleEvent);
        delete eventsMap.current[ev];
      }
    },
    [callObject, handleEvent]
  );

  return (
    <RecoilRoot>
      <DailyContext.Provider value={callObject}>
        <DailyEventContext.Provider value={{ on, off }}>
          <DailyRoom>
            <DailyParticipants>{children}</DailyParticipants>
          </DailyRoom>
        </DailyEventContext.Provider>
      </DailyContext.Provider>
    </RecoilRoot>
  );
};
