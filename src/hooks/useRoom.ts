import { DailyRoomInfo } from '@daily-co/daily-js';
import { useDebugValue } from 'react';
import { useRecoilValue } from 'recoil';

import { roomState } from '../DailyRoom';

/**
 * Stateful hook to work with room, domain and token configuration for a daily room.
 * Includes room default values.
 */
export const useRoom = (): DailyRoomInfo | null => {
  const room = useRecoilValue(roomState);
  useDebugValue(room);
  return room;
};
