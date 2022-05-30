import { DailyEvent, DailyEventObject } from '@daily-co/daily-js';
import throttle from 'lodash.throttle';
import { useContext, useEffect, useMemo, useRef } from 'react';

import { DailyEventContext } from '../DailyEventContext';
import { getUnique } from './useDailyEvent';

type EventCallback = (events: DailyEventObject[]) => void;

/**
 * Sets up a throttled daily event listener using [on](https://docs.daily.co/reference/daily-js/instance-methods/on) method.
 * When this hook is unmounted the event listener is unregistered using [off](https://docs.daily.co/reference/daily-js/instance-methods/off).
 *
 * In comparison to useDailyEvent the callback passed here will be called with an array of event objects.
 *
 * @param ev The DailyEvent to register.
 * @param callback A memoized callback reference to run when throttled events are emitted.
 * @param throttleTimeout The minimum waiting time until the callback is called again. Default: 100
 */
export const useThrottledDailyEvent = (
  ev: DailyEvent,
  callback: EventCallback,
  throttleTimeout = 100
) => {
  const { off, on } = useContext(DailyEventContext);
  const eventId = useMemo(() => getUnique(), []);

  const throttledEvents = useRef<DailyEventObject[]>([]);

  const emitEvents = useMemo(
    () =>
      throttle(
        () => {
          if (throttledEvents.current.length === 0) return;
          callback(throttledEvents.current);
          throttledEvents.current = [];
        },
        throttleTimeout,
        {
          trailing: true,
        }
      ),
    [callback, throttleTimeout]
  );

  useEffect(() => {
    if (!ev) return;
    const addEvent = (ev: DailyEventObject) => {
      throttledEvents.current.push(ev);
      /**
       * A 0ms timeout allows the event loop to process additional incoming events,
       * while the throttle is active. Otherwise every event would be delayed.
       */
      setTimeout(emitEvents, 0);
    };
    on(ev, addEvent, eventId);
    return () => {
      off(ev, eventId);
    };
  }, [emitEvents, ev, eventId, off, on]);
};
