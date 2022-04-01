import { DailyEvent, DailyEventObject } from '@daily-co/daily-js';
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
  const { on, off } = useContext(DailyEventContext);
  const eventId = useMemo(() => getUnique(), []);

  const throttledEvents = useRef<DailyEventObject[]>([]);

  useEffect(() => {
    if (!ev) return;
    const emitEvents = () => {
      if (throttledEvents.current.length === 0) return;
      callback(throttledEvents.current);
      throttledEvents.current = [];
    };
    const interval = setInterval(emitEvents, throttleTimeout);
    const addEvent = (ev: DailyEventObject) => {
      throttledEvents.current.push(ev);
    };
    on(ev, addEvent, eventId);
    return () => {
      clearInterval(interval);
      // Clear throttled queue
      emitEvents();
      off(ev, eventId);
    };
  }, [callback, ev, eventId, off, on, throttleTimeout]);
};
