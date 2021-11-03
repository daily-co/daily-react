import { DailyEvent, DailyEventObject } from '@daily-co/daily-js';
import { useContext, useEffect } from 'react';

import { DailyEventContext } from '../DailyProvider';

type EventCallback = (event?: DailyEventObject) => void;

export const useDailyEvent = (ev: DailyEvent, callback: EventCallback) => {
  const { on, off } = useContext(DailyEventContext);

  useEffect(() => {
    if (!ev) return;
    on(ev, callback);
    return () => {
      off(ev, callback);
    };
  }, [callback, ev, off, on]);
};
