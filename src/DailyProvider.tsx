import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyFactoryOptions,
} from '@daily-co/daily-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RecoilRoot, RecoilRootProps } from 'recoil';

import { DailyContext } from './DailyContext';
import { DailyDevices } from './DailyDevices';
import { DailyEventContext } from './DailyEventContext';
import { DailyLiveStreaming } from './DailyLiveStreaming';
import { DailyMeeting } from './DailyMeeting';
import { DailyNetwork } from './DailyNetwork';
import { DailyParticipants } from './DailyParticipants';
import { DailyRecordings } from './DailyRecordings';
import { DailyRoom } from './DailyRoom';
import { DailyScreenShares } from './DailyScreenShares';
import { customDeepEqual } from './lib/customDeepEqual';

type BaseProps =
  | DailyFactoryOptions
  | {
      callObject: DailyCall;
    };

type Props = BaseProps & {
  /**
   * Allows to override props for [RecoilRoot](https://recoiljs.org/docs/api-reference/core/RecoilRoot/).
   * In case you use Recoil in your own application, you can pass `override: false` to allow
   * daily-react to store its state in your application's RecoilRoot.
   * Default value: {}
   */
  recoilRootProps?: Omit<RecoilRootProps, 'children'>;
};

type EventsMap = Partial<Record<DailyEvent, Map<number, Function>>>;

export const DailyProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  recoilRootProps = {},
  ...props
}) => {
  const externalCallObject = 'callObject' in props ? props.callObject : null;

  const [callObject, setCallObject] = useState<DailyCall | null>(
    externalCallObject
  );
  const eventsMap = useRef<EventsMap>({});

  /**
   * Update callObject reference, in case externally created instance has changed.
   */
  useEffect(() => {
    if (!externalCallObject) return;

    const callFrameIdChanged =
      // TODO: Replace _callFrameId check with something "official".
      // @ts-ignore
      callObject?._callFrameId !== externalCallObject?._callFrameId;
    const callObjectNullified = !externalCallObject;
    const callObjectCreated = !callObject && externalCallObject;

    if (callObjectNullified) {
      /**
       * Passed callObject prop has been unset, e.g. because it was destroyed.
       * We'll want to let go the internal reference in that case.
       */
      setCallObject(null);
    } else if (callFrameIdChanged || callObjectCreated) {
      /**
       * Passed callObject has been created or changed.
       */
      setCallObject(externalCallObject);
    }
  }, [callObject, externalCallObject]);

  /**
   * Generic event handler to loop through registered event callbacks.
   */
  const handleEvent = useCallback((ev: DailyEventObject) => {
    if (!('action' in ev)) return;
    const event = ev.action as DailyEvent;
    for (let cb of eventsMap.current?.[event]?.values() ?? []) {
      cb(ev);
    }
  }, []);

  /**
   * In case events are set up via useDailyEvent before a DailyCall instance is available,
   * we'll register the events whenever daily is set.
   */
  const initEventHandlers = useCallback(
    (daily: DailyCall) => {
      if (!daily) return;
      (Object.keys(eventsMap.current) as DailyEvent[]).forEach((event) => {
        daily.off(event as DailyEvent, handleEvent);
        if (!daily.isDestroyed()) {
          daily.on(event as DailyEvent, handleEvent);
        }
      });
    },
    [handleEvent]
  );

  /**
   * Holds last used props when callObject instance was created.
   */
  const lastUsedProps = useRef<DailyFactoryOptions>();
  useEffect(() => {
    /**
     * Store externally created callObject and init event handlers.
     */
    if ('callObject' in props) {
      setCallObject(props.callObject);
      initEventHandlers(props.callObject);
      return;
    }

    async function destroyCallObject(co: DailyCall) {
      await co.destroy();
    }

    /**
     * callObject exists.
     */
    if (callObject) {
      /**
       * Props have changed. Destroy current instance, so a new one can be created.
       */
      if (!customDeepEqual(lastUsedProps.current, props)) {
        destroyCallObject(callObject);
      }
      /**
       * Return early.
       */
      return;
    }

    let co = DailyIframe.getCallInstance();
    if (!co) {
      /**
       * callObject doesn't exist, but should be created.
       * Important to spread props, because createCallObject alters the passed object (adds layout and dailyJsVersion).
       */
      co = DailyIframe.createCallObject({ ...props });
      lastUsedProps.current = props;
    }

    setCallObject(co);
    initEventHandlers(co);

    /**
     * Once instance is destroyed, nullify callObject, so a new one is created.
     */
    co.once('call-instance-destroyed', () => {
      setCallObject(null);
    });

    /**
     * No cleanup phase here, because callObject.destroy() returns a Promise.
     * We can't have asynchronous cleanups in a useEffect.
     * To avoid infinite render loops we compare the props when creating call object instances.
     */
  }, [callObject, initEventHandlers, props]);

  /**
   * Registers event callback.
   */
  const on = useCallback(
    (ev: DailyEvent, cb: Function, key: number) => {
      if (!eventsMap.current[ev]) {
        eventsMap.current[ev] = new Map();
        if (callObject) {
          /**
           * Make sure only 1 event listener is registered at anytime for handleEvent.
           * Otherwise, events sent from daily-js might be handled multiple times.
           */
          callObject.off(ev, handleEvent);
          if (!callObject.isDestroyed()) {
            callObject.on(ev, handleEvent);
          }
        }
      }
      if (!eventsMap.current[ev]?.has(key)) {
        eventsMap.current[ev]?.set(key, cb);
      }
    },
    [callObject, handleEvent]
  );

  /**
   * Unregisters event callback.
   */
  const off = useCallback(
    (ev: DailyEvent, key: number) => {
      eventsMap.current[ev]?.delete(key);
      if (eventsMap.current[ev]?.size === 0) {
        callObject?.off(ev, handleEvent);
        delete eventsMap.current[ev];
      }
    },
    [callObject, handleEvent]
  );

  return (
    <RecoilRoot {...recoilRootProps}>
      <DailyContext.Provider value={callObject}>
        <DailyEventContext.Provider value={{ on, off }}>
          <DailyRoom>
            <DailyMeeting>
              <DailyNetwork>
                <DailyParticipants>
                  <DailyScreenShares>
                    <DailyRecordings>
                      <DailyLiveStreaming>
                        <DailyDevices>{children}</DailyDevices>
                      </DailyLiveStreaming>
                    </DailyRecordings>
                  </DailyScreenShares>
                </DailyParticipants>
              </DailyNetwork>
            </DailyMeeting>
          </DailyRoom>
        </DailyEventContext.Provider>
      </DailyContext.Provider>
    </RecoilRoot>
  );
};
