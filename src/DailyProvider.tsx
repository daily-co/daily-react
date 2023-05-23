import DailyIframe, {
  DailyCall,
  DailyCallOptions,
  DailyEvent,
  DailyEventObject,
} from '@daily-co/daily-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RecoilRoot, RecoilRootProps } from 'recoil';

import { DailyContext } from './DailyContext';
import { DailyDevices } from './DailyDevices';
import { DailyEventContext } from './DailyEventContext';
import { DailyLiveStreaming } from './DailyLiveStreaming';
import { DailyMeeting } from './DailyMeeting';
import { DailyParticipants } from './DailyParticipants';
import { DailyRecordings } from './DailyRecordings';
import { DailyRoom } from './DailyRoom';

type DailyProperties = Pick<
  DailyCallOptions,
  | 'audioSource'
  | 'dailyConfig'
  | 'receiveSettings'
  | 'subscribeToTracksAutomatically'
  | 'token'
  | 'url'
  | 'userName'
  | 'videoSource'
>;

type BaseProps =
  | DailyProperties
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
  const [callObject, setCallObject] = useState<DailyCall | null>(
    'callObject' in props ? props.callObject : null
  );
  const eventsMap = useRef<EventsMap>({});

  /**
   * Update callObject reference, in case externally created instance has changed.
   */
  useEffect(() => {
    if (!('callObject' in props)) return;
    const callFrameIdChanged =
      // TODO: Replace _callFrameId check with something "official".
      // @ts-ignore
      callObject?._callFrameId !== props?.callObject?._callFrameId;
    const callObjectNullified = !props.callObject;
    const callObjectCreated = !callObject && props.callObject;

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
      setCallObject(props.callObject);
    }
  }, [callObject, props]);

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

  useEffect(() => {
    if (callObject) return;
    if ('callObject' in props) {
      setCallObject(props.callObject);
      initEventHandlers(props.callObject);
      return;
    }
    const co = DailyIframe.createCallObject(props);
    setCallObject(co);
    initEventHandlers(co);
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
              <DailyParticipants>
                <DailyRecordings>
                  <DailyLiveStreaming>
                    <DailyDevices>{children}</DailyDevices>
                  </DailyLiveStreaming>
                </DailyRecordings>
              </DailyParticipants>
            </DailyMeeting>
          </DailyRoom>
        </DailyEventContext.Provider>
      </DailyContext.Provider>
    </RecoilRoot>
  );
};
