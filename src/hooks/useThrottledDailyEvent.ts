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
 * You can pass an array of DailyEvents to register multiple daily events with a single callback handler.
 * The events returned in the callback parameter are guaranteed to be in the same order as they were emitted.
 *
 * @param ev The DailyEvent to register or an array of DailyEvent to register.
 * @param callback A memoized callback reference to run when throttled events are emitted.
 * @param throttleTimeout The minimum waiting time until the callback is called again. Default: 100
 */
export const useThrottledDailyEvent = (
  ev: DailyEvent | DailyEvent[],
  callback: EventCallback,
  throttleTimeout = 100
) => {
  const { off, on } = useContext(DailyEventContext);
  const eventId = useMemo(() => {
    if (Array.isArray(ev))
      return ev.reduce<Record<string, number>>((r, e) => {
        r[e] = getUnique();
        return r;
      }, {});
    return { [ev]: getUnique() };
  }, [ev]);

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
    if (Array.isArray(ev)) {
      ev.forEach((e) => on(e, addEvent, eventId[e]));
    } else {
      on(ev, addEvent, eventId[ev]);
    }
    return () => {
      if (Array.isArray(ev)) {
        ev.forEach((e) => off(e, eventId[e]));
      } else {
        off(ev, eventId[ev]);
      }
    };
  }, [emitEvents, ev, eventId, off, on]);
};
