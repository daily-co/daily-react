import { ExtendedDailyParticipant } from '../DailyParticipants';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';

const resolvePath = <T extends ExtendedDailyParticipant, P extends Paths<T>>(
  participant: T | null,
  path: P
): PathValue<T, P> => {
  return String(path)
    .split('.')
    .filter((key) => key.length)
    .reduce((p: any, key) => p && p[key], participant);
};

export const resolveParticipantPaths = <
  T extends ExtendedDailyParticipant,
  P extends Paths<T>
>(
  participant: T | null,
  paths: P[]
): { [K in P]: PathValue<T, K> } => {
  const result = {} as { [K in P]: PathValue<T, K> };
  paths.map((path) => (result[path] = resolvePath(participant, path)));

  return result;
};
