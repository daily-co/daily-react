import { DailyParticipant } from '@daily-co/daily-js';

export const getParticipantPathValue = (
  participant: DailyParticipant,
  path: string
) => {
  const paths = path.split('.');
  let value = participant;
  for (let i = 0; i < paths.length; i++) {
    // @ts-ignore
    value = value[paths[i]];
  }
  return value;
};
