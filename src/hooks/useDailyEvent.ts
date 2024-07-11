import { DailyEvent, DailyEventObject } from '@daily-co/daily-js';
import {
  useContext,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DailyEventContext } from '../DailyEventContext';

type EventCallback<T extends DailyEvent> = (event: DailyEventObject<T>) => void;

let priorityCounter = -1;
export const getPriorityUnique = () => priorityCounter--;
let uniqueCounter = 1;
export const getUnique = () => uniqueCounter++;

/**
 * Sets up a daily event listener using [on](https://docs.daily.co/reference/daily-js/instance-methods/on) method.
 * When this hook is unmounted the event listener is unregistered using [off](https://docs.daily.co/reference/daily-js/instance-methods/off).
 *
 * Warning: callback has to be a memoized reference (e.g. via [useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback)).
 * Otherwise a console error might be thrown indicating a re-render loop issue.
 *
 * @param ev The DailyEvent to register.
 * @param callback A memoized callback reference to run when the event is emitted.
 */
export const useDailyEvent = <T extends DailyEvent>(
  ev: T,
  callback: EventCallback<T>,
  INTERNAL_priority = false
) => {
  const { off, on } = useContext(DailyEventContext);
  const [isBlocked, setIsBlocked] = useState(false);
  const reassignCount = useRef<number>(0);

  const eventId = useMemo(
    () => (INTERNAL_priority ? getPriorityUnique() : getUnique()),
    [INTERNAL_priority]
  );

  useEffect(() => {
    if (!ev || isBlocked) return;
    /**
     * Check if callback has been reassigned often enough without hitting the 50ms timeout.
     */
    if (reassignCount.current > 100000) {
      console.error(
        `useDailyEvent called with potentially non-memoized event callback or due to too many re-renders.
        Memoize using useCallback to avoid re-render loop or reduce the amount of state transitions the callback depends on.
        Passed callback for '${ev}' event is NOT registered.`,
        callback
      );
      setIsBlocked(true);
      return;
    }
    reassignCount.current++;
    const timeout = setTimeout(() => {
      reassignCount.current = 0;
    }, 50);
    on(ev, callback, eventId);
    return () => {
      clearTimeout(timeout);
      off(ev, eventId);
    };
  }, [callback, ev, eventId, isBlocked, off, on]);

  useDebugValue({
    event: ev,
    eventId,
    isBlocked,
    callback,
  });
};
