import Daily, { DailyCall, DailyFactoryOptions } from '@daily-co/daily-js';
import { useEffect, useRef, useState } from 'react';

import { customDeepEqual } from '../lib/customDeepEqual';

type InstanceType = 'callFrame' | 'callObject';

const defaultOptions: DailyFactoryOptions = {};
const defaultShouldCreateInstance = () => true;

interface Props {
  parentEl?: HTMLElement;
  options?: DailyFactoryOptions;
  shouldCreateInstance?(): boolean;
}

const defaultProps: Props = {
  options: defaultOptions,
  shouldCreateInstance: defaultShouldCreateInstance,
};

/**
 * Helper hook to maintain custom call instances in React codebases.
 */
export const useCallInstance = (
  type: InstanceType,
  {
    parentEl,
    options = defaultOptions,
    shouldCreateInstance = defaultShouldCreateInstance,
  }: Props = defaultProps
) => {
  const [callInstance, setCallInstance] = useState<DailyCall | null>(null);

  /**
   * Holds last used props when callObject instance was created.
   */
  const lastUsedOptions = useRef<DailyFactoryOptions>();
  useEffect(() => {
    if (!shouldCreateInstance()) {
      return;
    }

    async function destroyCallInstance(co: DailyCall) {
      await co.destroy();
    }

    /**
     * callInstance exists.
     */
    if (callInstance) {
      /**
       * Props have changed. Destroy current instance, so a new one can be created.
       */
      if (!customDeepEqual(lastUsedOptions.current, options)) {
        destroyCallInstance(callInstance);
      }
      /**
       * Return early.
       */
      return;
    }

    let co = Daily.getCallInstance();
    if (!co) {
      /**
       * callInstance doesn't exist, but should be created.
       * Important to spread props, because createCallObject/createFrame alters the passed object (adds layout and dailyJsVersion).
       */
      switch (type) {
        case 'callFrame':
          co = parentEl
            ? Daily.createFrame(parentEl, { ...options })
            : Daily.createFrame({ ...options });
          break;
        case 'callObject':
          co = Daily.createCallObject({ ...options });
          break;
      }
      lastUsedOptions.current = options;
    }

    setCallInstance(co);

    /**
     * Once instance is destroyed, nullify callInstance, so a new one is created.
     */
    co.once('call-instance-destroyed', () => {
      setCallInstance(null);
    });

    /**
     * No cleanup phase here, because callObject.destroy() returns a Promise.
     * We can't have asynchronous cleanups in a useEffect.
     * To avoid infinite render loops we compare the props when creating call object instances.
     */
  }, [callInstance, options, parentEl, shouldCreateInstance, type]);

  return callInstance;
};
