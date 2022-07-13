import { DailyParticipant } from '@daily-co/daily-js';

export const getParticipantPathValue = (
  participant: DailyParticipant,
  path: string
) => {
  // @ts-ignore
  return path.split('.').reduce((r, k) => r?.[k], participant);
};
