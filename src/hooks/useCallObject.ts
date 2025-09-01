import { Props, useCallInstance } from './useCallInstance';

type CallObjectProps = Omit<Props, 'parentEl'>;

/**
 * Helper hook to maintain custom callObject instances in React codebases.
 * This hook will throw an error if the call object cannot be created in strict mode,
 * which is true when the browser doesn't support WebRTC.
 */
export const useCallObject = (props: CallObjectProps) =>
  useCallInstance('callObject', props);
