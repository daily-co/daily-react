import { useCallInstance } from './useCallInstance';

type Props = Parameters<typeof useCallInstance>[1];

/**
 * Helper hook to maintain custom callObject instances in React codebases.
 */
export const useCallObject = (props: Props) =>
  useCallInstance('callObject', props);
