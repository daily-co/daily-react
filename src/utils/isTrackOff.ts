import { DailyTrackState } from '@daily-co/daily-js';

export const isTrackOff = (track: DailyTrackState) =>
  ['blocked', 'off'].includes(track.state);
