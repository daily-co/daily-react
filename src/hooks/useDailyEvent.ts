import { DailyEvent, DailyEventObject } from '@daily-co/daily-js';
import { useContext, useEffect, useRef, useState } from 'react';

import { DailyEventContext } from '../DailyProvider';

type EventCallback = (event?: DailyEventObject) => void;

export const useDailyEvent = (ev: DailyEvent, callback: EventCallback) => {
  const { on, off } = useContext(DailyEventContext);
  const [isBlocked, setIsBlocked] = useState(false);
  const reassignCount = useRef<number>(0);

  useEffect(() => {
    if (!ev || isBlocked) return;
    /**
     * Check if callback has been reassigned often enough without hitting the 50ms timeout.
     */
    if (reassignCount.current > 100) {
      console.error(
        `useDailyEvent called with potentially non-memoized event callback.
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
    on(ev, callback);
    return () => {
      clearTimeout(timeout);
      off(ev, callback);
    };
  }, [callback, ev, isBlocked, off, on]);
};
