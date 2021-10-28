import { DailyEventObjectAppMessage } from '@daily-co/daily-js';
import { useCallback } from 'react';

import { useDaily, useDailyEvent } from '..';

type SendAppMessage<Data = any> = (data: Data, to?: string) => void;

interface UseAppMessageArgs<Data> {
  onAppMessage?(
    ev: DailyEventObjectAppMessage<Data>,
    sendAppMessage?: SendAppMessage<Data>
  ): void;
}

export const useAppMessage = <Data = any>({
  onAppMessage,
}: UseAppMessageArgs<Data> = {}) => {
  const daily = useDaily();

  const sendAppMessage: SendAppMessage<Data> = useCallback(
    (data, to = '*') => {
      if (!daily) return;
      daily.sendAppMessage(data, to);
    },
    [daily]
  );

  const handleAppMessage = useCallback(
    (ev: DailyEventObjectAppMessage<Data>) => {
      onAppMessage?.(ev, sendAppMessage);
    },
    [onAppMessage, sendAppMessage]
  );

  useDailyEvent('app-message', handleAppMessage);

  return sendAppMessage;
};
