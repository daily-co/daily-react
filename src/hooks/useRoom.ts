import { DailyRoomInfo } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useDebugValue } from 'react';

import { roomState } from '../DailyRoom';

/**
 * Stateful hook to work with room, domain and token configuration for a daily room.
 * Includes room default values.
 */
export const useRoom = (): DailyRoomInfo | null => {
  const room = useAtomValue(roomState);
  useDebugValue(room);
  return room;
};
