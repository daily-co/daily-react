import { useContext } from 'react';

import { DailyContext } from '../DailyContext';

/**
 * Returns callObject instance passed to or created by closest <DailyProvider>.
 */
export const useDaily = () => {
  const daily = useContext(DailyContext);
  return daily;
};
