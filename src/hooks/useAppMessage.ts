import { DailyEventObjectAppMessage } from '@daily-co/daily-js';
import { useCallback } from 'react';

import { useDaily, useDailyEvent } from '..';

interface UseAppMessageArgs<Data> {
  onAppMessage?(ev: DailyEventObjectAppMessage<Data>): void;
}

export const useAppMessage = <Data = any>({
  onAppMessage,
}: UseAppMessageArgs<Data> = {}) => {
  const daily = useDaily();

  const sendAppMessage = useCallback(
    (data: Data, to: string = '*') => {
      if (!daily) return;
      daily.sendAppMessage(data, to);
    },
    [daily]
  );

  useDailyEvent('app-message', onAppMessage);

  return sendAppMessage;
};
