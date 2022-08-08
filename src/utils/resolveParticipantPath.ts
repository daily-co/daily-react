import { ExtendedDailyParticipant } from '../DailyParticipants';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';

export const resolveParticipantPath = <
  T extends ExtendedDailyParticipant,
  P extends Paths<T>
>(
  participant: T,
  path: P
): PathValue<T, P> => {
  return String(path)
    .split('.')
    .filter((key) => key.length)
    .reduce((p: any, key) => p && p[key], participant);
};
