import {
  DailyCameraErrorObject,
  DailyEventObjectCameraError,
  DailyEventObjectParticipant,
} from '@daily-co/daily-js';
import React, { useCallback } from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { DailyDevicesContext } from './DailyDevicesContext';
import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { RECOIL_PREFIX } from './lib/constants';

type GeneralState =
  | 'pending'
  | 'not-supported'
  | 'granted'
  | 'blocked'
  | 'in-use'
  | 'not-found'
  | 'constraints-invalid'
  | 'constraints-none-specified'
  | 'undefined-mediadevices'
  | 'unknown';

type DeviceState = 'granted' | 'in-use';
export interface StatefulDevice {
  device: MediaDeviceInfo;
  selected: boolean;
  state: DeviceState;
}

export const generalCameraState = atom<GeneralState>({
  key: RECOIL_PREFIX + 'general-camera-state',
  default: 'pending',
});
export const generalMicrophoneState = atom<GeneralState>({
  key: RECOIL_PREFIX + 'general-microphone-state',
  default: 'pending',
});
export const cameraDevicesState = atom<StatefulDevice[]>({
  key: RECOIL_PREFIX + 'camera-devices',
  default: [],
});
export const microphoneDevicesState = atom<StatefulDevice[]>({
  key: RECOIL_PREFIX + 'microphone-devices',
  default: [],
});
export const speakerDevicesState = atom<StatefulDevice[]>({
  key: RECOIL_PREFIX + 'speaker-devices',
  default: [],
});
export const lastCameraErrorState = atom<DailyCameraErrorObject>({
  key: RECOIL_PREFIX + 'last-camera-error',
  default: null,
});

export const DailyDevices: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const daily = useDaily();

  /**
   * Refreshes list of available devices using enumerateDevices.
   * Previous device states are kept in place, otherwise states are initialized as 'granted'.
   */
  const refreshDevices = useRecoilCallback(
    ({ transact_UNSTABLE }) =>
      async () => {
        /**
         * Check for legacy browsers.
         */
        if (
          typeof navigator?.mediaDevices?.getUserMedia === 'undefined' ||
          typeof navigator?.mediaDevices?.enumerateDevices === 'undefined'
        ) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'not-supported');
            set(generalMicrophoneState, 'not-supported');
          });
          return;
        }

        if (!daily) return;

        try {
          const { devices } = await daily.enumerateDevices();
          /**
           * Filter out "empty" devices for when device access has not been granted (yet).
           */
          const cams = devices.filter(
            (d) => d.kind === 'videoinput' && d.deviceId !== ''
          );
          const mics = devices.filter(
            (d) => d.kind === 'audioinput' && d.deviceId !== ''
          );
          const speakers = devices.filter(
            (d) => d.kind === 'audiooutput' && d.deviceId !== ''
          );
          const { camera, mic, speaker } = await daily.getInputDevices();

          const mapDevice = (
            device: {} | MediaDeviceInfo,
            d: MediaDeviceInfo,
            prevDevices: StatefulDevice[]
          ) => ({
            device: d,
            selected: 'deviceId' in device && d.deviceId === device.deviceId,
            state:
              prevDevices.find((p) => p.device.deviceId === d.deviceId)
                ?.state ?? 'granted',
          });
          const sortDeviceByLabel = (a: StatefulDevice, b: StatefulDevice) => {
            if (a.device.deviceId === 'default') return -1;
            if (b.device.deviceId === 'default') return 1;
            if (a.device.label < b.device.label) return -1;
            if (a.device.label > b.device.label) return 1;
            return 0;
          };

          transact_UNSTABLE(({ set }) => {
            set(cameraDevicesState, (prevCams) =>
              cams
                .filter(Boolean)
                .map<StatefulDevice>((d) => mapDevice(camera, d, prevCams))
                .sort(sortDeviceByLabel)
            );
            set(microphoneDevicesState, (prevMics) =>
              mics
                .filter(Boolean)
                .map<StatefulDevice>((d) => mapDevice(mic, d, prevMics))
                .sort(sortDeviceByLabel)
            );
            set(speakerDevicesState, (prevSpeakers) =>
              speakers
                .filter(Boolean)
                .map<StatefulDevice>((d) => mapDevice(speaker, d, prevSpeakers))
                .sort(sortDeviceByLabel)
            );
          });
        } catch (e) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'not-supported');
            set(generalMicrophoneState, 'not-supported');
          });
        }
      },
    [daily]
  );

  /**
   * Updates general and specific device states, based on blocked status.
   */
  const updateDeviceStates = useRecoilCallback(
    ({ set, snapshot, transact_UNSTABLE }) =>
      async () => {
        if (!daily) return;

        const currentCamState = await snapshot.getPromise(generalCameraState);
        const currentMicState = await snapshot.getPromise(
          generalMicrophoneState
        );

        const { tracks } = daily.participants().local;

        const awaitingCamAccess =
          currentCamState === 'pending' && tracks.video.state === 'interrupted';
        const awaitingMicAccess =
          currentMicState === 'pending' && tracks.audio.state === 'interrupted';

        if (tracks.audio?.blocked?.byDeviceInUse) {
          transact_UNSTABLE(({ set }) => {
            set(generalMicrophoneState, 'in-use');
            set(microphoneDevicesState, (mics) =>
              mics.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'in-use' } : m
              )
            );
          });
        } else if (tracks.audio?.blocked?.byDeviceMissing) {
          set(generalMicrophoneState, 'not-found');
        } else if (tracks.audio?.blocked?.byPermissions) {
          set(generalMicrophoneState, 'blocked');
        } else if (!awaitingMicAccess) {
          transact_UNSTABLE(({ set }) => {
            set(generalMicrophoneState, 'granted');
            set(microphoneDevicesState, (mics) =>
              mics.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'granted' } : m
              )
            );
          });
        }

        if (tracks.video?.blocked?.byDeviceInUse) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'in-use');
            set(cameraDevicesState, (cams) =>
              cams.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'in-use' } : m
              )
            );
          });
        } else if (tracks.video?.blocked?.byDeviceMissing) {
          set(generalCameraState, 'not-found');
        } else if (tracks.video?.blocked?.byPermissions) {
          set(generalCameraState, 'blocked');
        } else if (!awaitingCamAccess) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'granted');
            set(cameraDevicesState, (cams) =>
              cams.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'granted' } : m
              )
            );
          });
        }
        refreshDevices();
      },
    [daily, refreshDevices]
  );

  useDailyEvent(
    'participant-updated',
    useCallback(
      (ev: DailyEventObjectParticipant) => {
        if (!ev.participant.local) return;
        updateDeviceStates();
      },
      [updateDeviceStates]
    )
  );

  useDailyEvent('available-devices-updated', refreshDevices);
  useDailyEvent('selected-devices-updated', refreshDevices);

  useDailyEvent(
    'camera-error',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (ev: DailyEventObjectCameraError) => {
          transact_UNSTABLE(({ set }) => {
            set(lastCameraErrorState, ev.error);
            switch (ev.error?.type) {
              case 'cam-in-use':
                set(generalCameraState, 'in-use');
                break;
              case 'mic-in-use':
                set(generalMicrophoneState, 'in-use');
                break;
              case 'cam-mic-in-use':
                set(generalCameraState, 'in-use');
                set(generalMicrophoneState, 'in-use');
                break;
              case 'not-found':
                if (ev.error?.missingMedia.includes('video'))
                  set(generalCameraState, 'not-found');
                if (ev.error?.missingMedia.includes('audio'))
                  set(generalMicrophoneState, 'not-found');
                break;
              case 'permissions':
                if (ev.error?.blockedMedia.includes('video'))
                  set(generalCameraState, 'blocked');
                if (ev.error?.blockedMedia.includes('audio'))
                  set(generalMicrophoneState, 'blocked');
                break;
              case 'constraints':
                if (ev.error?.reason === 'invalid') {
                  set(generalCameraState, 'constraints-invalid');
                  set(generalMicrophoneState, 'constraints-invalid');
                } else if (ev.error?.reason === 'none-specified') {
                  set(generalCameraState, 'constraints-none-specified');
                  set(generalMicrophoneState, 'constraints-none-specified');
                }
                break;
              case 'undefined-mediadevices':
                set(generalCameraState, 'undefined-mediadevices');
                set(generalMicrophoneState, 'undefined-mediadevices');
                break;
              case 'unknown':
              default:
                set(generalCameraState, 'unknown');
                set(generalMicrophoneState, 'unknown');
                break;
            }
          });
        },
      []
    )
  );

  /**
   * Update all device state, when camera is started.
   */
  useDailyEvent(
    'started-camera',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        () => {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'granted');
            set(generalMicrophoneState, 'granted');
          });
          updateDeviceStates();
        },
      [updateDeviceStates]
    )
  );

  return (
    <DailyDevicesContext.Provider value={{ refreshDevices }}>
      {children}
    </DailyDevicesContext.Provider>
  );
};
