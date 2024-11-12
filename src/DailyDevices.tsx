import {
  DailyCameraErrorObject,
  DailyCameraErrorType,
} from '@daily-co/daily-js';
import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback } from 'react';

import { DailyDevicesContext } from './DailyDevicesContext';
import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { jotaiDebugLabel } from './lib/jotai-custom';

type GeneralState =
  | 'idle'
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

export const generalCameraState = atom<GeneralState>('idle');
generalCameraState.debugLabel = jotaiDebugLabel('camera-state');
export const generalMicrophoneState = atom<GeneralState>('idle');
generalMicrophoneState.debugLabel = jotaiDebugLabel('microphone-state');
export const cameraDevicesState = atom<StatefulDevice[]>([]);
cameraDevicesState.debugLabel = jotaiDebugLabel('camera-devices');
export const microphoneDevicesState = atom<StatefulDevice[]>([]);
microphoneDevicesState.debugLabel = jotaiDebugLabel('microphone-devices');
export const speakerDevicesState = atom<StatefulDevice[]>([]);
speakerDevicesState.debugLabel = jotaiDebugLabel('speaker-devices');
export const lastCameraErrorState =
  atom<DailyCameraErrorObject<DailyCameraErrorType> | null>(null);
lastCameraErrorState.debugLabel = jotaiDebugLabel('last-camera-error');

export const DailyDevices: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const daily = useDaily();

  /**
   * Refreshes list of available devices using enumerateDevices.
   * Previous device states are kept in place, otherwise states are initialized as 'granted'.
   */
  const refreshDevices = useAtomCallback(
    useCallback(
      async (_get, set) => {
        /**
         * Check for legacy browsers.
         */
        if (
          typeof navigator?.mediaDevices?.getUserMedia === 'undefined' ||
          typeof navigator?.mediaDevices?.enumerateDevices === 'undefined'
        ) {
          set(generalCameraState, 'not-supported');
          set(generalMicrophoneState, 'not-supported');
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
        } catch (e) {
          set(generalCameraState, 'not-supported');
          set(generalMicrophoneState, 'not-supported');
        }
      },
      [daily]
    )
  );

  /**
   * Updates general and specific device states, based on blocked status.
   */
  const updateDeviceStates = useAtomCallback(
    useCallback(
      async (get, set) => {
        if (!daily) return;

        const currentCamState = get(generalCameraState);
        const currentMicState = get(generalMicrophoneState);

        const participants = daily.participants();
        // Guard against potentially uninitialized local participant
        if (!participants.local) return;

        const { tracks } = participants.local;

        let camPermissionState: PermissionState = 'prompt';
        let micPermissionState: PermissionState = 'prompt';
        if (navigator.permissions) {
          try {
            const camPermission = await navigator.permissions.query({
              // @ts-ignore
              name: 'camera',
            });
            camPermissionState = camPermission.state;
            const micPermission = await navigator.permissions.query({
              // @ts-ignore
              name: 'microphone',
            });
            micPermissionState = micPermission.state;
          } catch {
            // Permissions query not available
          }
        }

        const awaitingCamAccess =
          camPermissionState === 'prompt' &&
          ['idle', 'pending'].includes(currentCamState) &&
          tracks.video.state === 'interrupted' &&
          !tracks.video.persistentTrack;
        const initialCamOff =
          ['idle', 'pending'].includes(currentCamState) &&
          !tracks.video.persistentTrack &&
          Boolean(tracks.video.off?.byUser);
        const awaitingMicAccess =
          micPermissionState === 'prompt' &&
          ['idle', 'pending'].includes(currentMicState) &&
          tracks.audio.state === 'interrupted' &&
          !tracks.audio.persistentTrack;
        const initialMicOff =
          ['idle', 'pending'].includes(currentMicState) &&
          !tracks.audio.persistentTrack &&
          Boolean(tracks.audio.off?.byUser);

        if (tracks.audio?.blocked?.byDeviceInUse) {
          set(generalMicrophoneState, 'in-use');
          set(microphoneDevicesState, (mics) =>
            mics.map<StatefulDevice>((m) =>
              m.selected ? { ...m, state: 'in-use' } : m
            )
          );
        } else if (tracks.audio?.blocked?.byDeviceMissing) {
          set(generalMicrophoneState, 'not-found');
        } else if (
          tracks.audio?.blocked?.byPermissions ||
          micPermissionState === 'denied'
        ) {
          set(generalMicrophoneState, 'blocked');
        } else if (awaitingMicAccess) {
          set(generalMicrophoneState, 'pending');
        } else if (initialMicOff) {
          set(generalMicrophoneState, 'idle');
        } else {
          set(generalMicrophoneState, 'granted');
          set(microphoneDevicesState, (mics) =>
            mics.map<StatefulDevice>((m) =>
              m.selected ? { ...m, state: 'granted' } : m
            )
          );
        }

        if (tracks.video?.blocked?.byDeviceInUse) {
          set(generalCameraState, 'in-use');
          set(cameraDevicesState, (cams) =>
            cams.map<StatefulDevice>((m) =>
              m.selected ? { ...m, state: 'in-use' } : m
            )
          );
        } else if (tracks.video?.blocked?.byDeviceMissing) {
          set(generalCameraState, 'not-found');
        } else if (
          tracks.video?.blocked?.byPermissions ||
          camPermissionState === 'denied'
        ) {
          set(generalCameraState, 'blocked');
        } else if (awaitingCamAccess) {
          set(generalCameraState, 'pending');
        } else if (initialCamOff) {
          set(generalCameraState, 'idle');
        } else {
          set(generalCameraState, 'granted');
          set(cameraDevicesState, (cams) =>
            cams.map<StatefulDevice>((m) =>
              m.selected ? { ...m, state: 'granted' } : m
            )
          );
        }
        refreshDevices();
      },
      [daily, refreshDevices]
    )
  );

  useDailyEvent(
    'participant-updated',
    useCallback(
      (ev) => {
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
    useAtomCallback(
      useCallback((_get, set, ev) => {
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
      }, [])
    )
  );

  /**
   * Update all device state, when camera is started.
   */
  useDailyEvent(
    'started-camera',
    useAtomCallback(
      useCallback(
        (_get, set) => {
          set(generalCameraState, 'granted');
          set(generalMicrophoneState, 'granted');
          updateDeviceStates();
        },
        [updateDeviceStates]
      )
    )
  );

  return (
    <DailyDevicesContext.Provider value={{ refreshDevices }}>
      {children}
    </DailyDevicesContext.Provider>
  );
};
