import { MediaTrackState, useMediaTrack } from './useMediaTrack';

/**
 * Returns a participant's custom track and state.
 *
 * Custom tracks are started with `daily.startCustomTrack()` and identified by
 * their `trackName`. The returned track can be rendered with `DailyVideo` or
 * `DailyAudioTrack` by passing the same `trackName` as their `type` prop.
 *
 * Note: `trackName` is resolved internally as a participant-property path, whose
 * segments are split on `.`. Track names containing a `.` will not resolve; use
 * simple identifiers (e.g. `my-track`, not `my.track`).
 *
 * @param participantId The participant's session_id.
 * @param trackName The custom track's name, as passed to `startCustomTrack()`.
 */
export const useCustomTrack = (
  participantId: string,
  trackName: string
): MediaTrackState => useMediaTrack(participantId, trackName);
