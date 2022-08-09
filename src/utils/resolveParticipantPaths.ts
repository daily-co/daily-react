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
  P extends Paths<T>[]
>(
  participant: T | null,
  paths: P
): { [K in keyof P]: PathValue<T, P[K]> } => {
  return paths.map((path) => resolvePath(participant, path)) as {
    [K in keyof P]: PathValue<T, P[K]>;
  };
};
