import { DailyEvent, DailyEventObject } from '@daily-co/daily-js';
import throttle from 'lodash.throttle';
import {
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { DailyEventContext } from '../DailyEventContext';
import { getPriorityUnique, getUnique, useDailyEvent } from './useDailyEvent';

type EnsureArray<T> = T extends DailyEvent ? [T] : T;

type EventObjectsFor<T> = EnsureArray<T> extends (infer U)[]
  ? U extends DailyEvent
    ? DailyEventObject<U>
    : never
  : never;

type EventCallback<T extends DailyEvent | DailyEvent[]> = (
  events: EventObjectsFor<T>[]
) => void;

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
 * @param throttleTimeout The minimum waiting time until the callback is called again. Default: 500
 */
export const useThrottledDailyEvent = <T extends DailyEvent>(
  ev: T | T[],
  callback: EventCallback<EnsureArray<T>>,
  throttleTimeout = 500,
  INTERNAL_priority = false
) => {
  const { off, on } = useContext(DailyEventContext);
  const eventId = useMemo(() => {
    if (Array.isArray(ev))
      return ev.reduce<Record<string, number>>((r, e) => {
        r[e] = INTERNAL_priority ? getPriorityUnique() : getUnique();
        return r;
      }, {});
    return { [ev]: INTERNAL_priority ? getPriorityUnique() : getUnique() };
  }, [ev, INTERNAL_priority]);

  const throttledEvents = useRef<EventObjectsFor<T>[]>([]);

  useDailyEvent(
    'call-instance-destroyed',
    useCallback(() => {
      throttledEvents.current.length = 0;
    }, [])
  );

  const emitEvents = useMemo(
    () =>
      throttle(
        () => {
          if (throttledEvents.current.length === 0) return;
          callback(throttledEvents.current);
          throttledEvents.current.length = 0;
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
      emitEvents();
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

  useDebugValue({
    event: ev,
    eventId,
  });
};
