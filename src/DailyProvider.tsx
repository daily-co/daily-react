import {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyFactoryOptions,
} from '@daily-co/daily-js';
// Import Jotai Provider if you are using middleware that requires it
import { Provider } from 'jotai';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { DailyContext } from './DailyContext';
import { DailyDevices } from './DailyDevices';
import { DailyEventContext } from './DailyEventContext';
import { DailyLiveStreaming } from './DailyLiveStreaming';
import { DailyMeeting } from './DailyMeeting';
import { DailyNetwork } from './DailyNetwork';
import { DailyParticipants } from './DailyParticipants';
import { DailyRecordings } from './DailyRecordings';
import { DailyRoom } from './DailyRoom';
import { DailyTranscriptions } from './DailyTranscriptions';
import { useCallObject } from './hooks/useCallObject';

type BaseProps =
  | DailyFactoryOptions
  | {
      callObject: DailyCall | null;
    };

type Props = BaseProps & {
  jotaiStore?: React.ComponentProps<typeof Provider>['store'];
};

type EventsMap = Partial<Record<DailyEvent, Map<number, Function>>>;

export const DailyProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  jotaiStore,
  ...props
}) => {
  const eventsMap = useRef<EventsMap>({});

  /**
   * Generic event handler to loop through registered event callbacks.
   */
  const handleEvent = useCallback((ev: DailyEventObject) => {
    if (!('action' in ev)) return;
    const event = ev.action as DailyEvent;
    const allHandlers = Array.from(eventsMap.current?.[event] ?? []);
    const priorityHandlers = allHandlers.filter(([key]) => key < 0);
    const normalHandlers = allHandlers.filter(([key]) => key > 0);
    const sortedHandlers = [...priorityHandlers, ...normalHandlers];
    for (let [, cb] of sortedHandlers) {
      cb(ev);
    }
  }, []);

  /**
   * In case events are set up via useDailyEvent before a DailyCall instance is available,
   * we'll register the events whenever daily is set.
   */
  const initEventHandlers = useCallback(
    (daily: DailyCall) => {
      if (!daily) return;
      (Object.keys(eventsMap.current) as DailyEvent[]).forEach((event) => {
        daily.off(event as DailyEvent, handleEvent);
        if (!daily.isDestroyed()) {
          daily.on(event as DailyEvent, handleEvent);
        }
      });
    },
    [handleEvent]
  );

  const externalCallObject = 'callObject' in props ? props.callObject : null;

  const memoizedOptions = useMemo(
    () => ('callObject' in props ? {} : props),
    [props]
  );
  const internalCallObject = useCallObject({
    options: memoizedOptions,
    shouldCreateInstance: useCallback(() => {
      return !('callObject' in props);
    }, [props]),
  });

  const callObject = externalCallObject ?? internalCallObject;

  useEffect(() => {
    if (!callObject) return;
    initEventHandlers(callObject);
  }, [callObject, initEventHandlers]);

  /**
   * Registers event callback.
   */
  const on = useCallback(
    (ev: DailyEvent, cb: Function, key: number) => {
      if (!eventsMap.current[ev]) {
        eventsMap.current[ev] = new Map();
        if (callObject) {
          /**
           * Make sure only 1 event listener is registered at any time for handleEvent.
           * Otherwise, events sent from daily-js might be handled multiple times.
           */
          callObject.off(ev, handleEvent);
          if (!callObject.isDestroyed()) {
            callObject.on(ev, handleEvent);
          }
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
    <Provider store={jotaiStore}>
      <DailyContext.Provider value={callObject}>
        <DailyEventContext.Provider value={{ on, off }}>
          <DailyRoom>
            <DailyMeeting>
              <DailyNetwork>
                <DailyParticipants>
                  <DailyRecordings>
                    <DailyLiveStreaming>
                      <DailyTranscriptions>
                        <DailyDevices>{children}</DailyDevices>
                      </DailyTranscriptions>
                    </DailyLiveStreaming>
                  </DailyRecordings>
                </DailyParticipants>
              </DailyNetwork>
            </DailyMeeting>
          </DailyRoom>
        </DailyEventContext.Provider>
      </DailyContext.Provider>
    </Provider>
  );
};
