import { ExtendedDailyParticipant } from '../DailyParticipants';
import type { NumericKeys } from '../types/NumericKeys';
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

type ResolveParticipantPathsReturnType<
  T extends ExtendedDailyParticipant,
  P extends Paths<T>[]
> = { [K in keyof P]: K extends NumericKeys ? PathValue<T, P[K]> : never };

export const resolveParticipantPaths = <
  T extends ExtendedDailyParticipant,
  P extends Paths<T>[]
>(
  participant: T | null,
  paths: P
): ResolveParticipantPathsReturnType<T, P> => {
  return paths.map((path) =>
    resolvePath(participant, path)
  ) as ResolveParticipantPathsReturnType<T, P>;
};
