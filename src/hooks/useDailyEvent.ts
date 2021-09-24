import { DailyEvent, DailyEventObject } from '@daily-co/daily-js';
import { useEffect } from 'react';

import { useDaily } from './useDaily';

type EventCallback = (event?: DailyEventObject) => void;

export const useDailyEvent = (ev: DailyEvent, callback?: EventCallback) => {
  const daily = useDaily();

  useEffect(() => {
    if (!daily || !callback || !ev) return;
    daily.on(ev, callback);
    return () => {
      daily.off(ev, callback);
    };
  }, [callback, daily, ev]);
};
