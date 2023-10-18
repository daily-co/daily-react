import { DailyTrackState } from '@daily-co/daily-js';

export const isTrackOff = (trackState: DailyTrackState['state']) =>
  ['blocked', 'off'].includes(trackState);
