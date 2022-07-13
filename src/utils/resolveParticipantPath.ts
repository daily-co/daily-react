import { ExtendedDailyParticipant } from '../DailyParticipants';
import type { Paths } from '../../types/paths';

export const getParticipantPathValue = (
  participant: ExtendedDailyParticipant,
  path: Paths<ExtendedDailyParticipant>
) => {
  // @ts-ignore
  return path.split('.').reduce((r, k) => r?.[k], participant);
};
