import {
  DailyEventObjectCameraError,
  DailyEventObjectFatalError,
  DailyEventObjectParticipant,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

type DeviceState =
  | 'loading'
  | 'not-supported'
  | 'pending'
  | 'granted'
  | 'blocked'
  | 'in-use'
  | 'not-found';

export interface StatefulDevice {
  device: MediaDeviceInfo;
  selected: boolean;
  state: DeviceState;
}

const generalCameraState = atom<DeviceState>({
  key: 'general-camera-state',
  default: 'loading',
});
const generalMicrophoneState = atom<DeviceState>({
  key: 'general-microphone-state',
  default: 'loading',
});
const cameraDevicesState = atom<StatefulDevice[]>({
  key: 'camera-devices',
  default: [],
});
const microphoneDevicesState = atom<StatefulDevice[]>({
  key: 'microphone-devices',
  default: [],
});
const speakerDevicesState = atom<StatefulDevice[]>({
  key: 'speaker-devices',
  default: [],
});

export const useDevices = () => {
  const daily = useDaily();

  const camState = useRecoilValue(generalCameraState);
  const micState = useRecoilValue(generalCameraState);
  const camDevices = useRecoilValue(cameraDevicesState);
  const micDevices = useRecoilValue(microphoneDevicesState);
  const speakerDevices = useRecoilValue(speakerDevicesState);

  const refreshDevices = useRecoilCallback(
    ({ set }) =>
      async () => {
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
          set(
            cameraDevicesState,
            cams
              .filter(Boolean)
              .map<StatefulDevice>((d) => ({
                device: d,
                selected:
                  'deviceId' in camera && d.deviceId === camera.deviceId,
                state: 'granted',
              }))
              .sort((a, b) => {
                if (
                  a.device.deviceId === 'default' ||
                  b.device.deviceId === 'default'
                )
                  return 1;
                if (a.device.label < b.device.label) return -1;
                if (a.device.label > b.device.label) return 1;
                return 0;
              })
          );
          set(
            microphoneDevicesState,
            mics
              .filter(Boolean)
              .map<StatefulDevice>((d) => ({
                device: d,
                selected: 'deviceId' in mic && d.deviceId === mic.deviceId,
                state: 'granted',
              }))
              .sort((a, b) => {
                if (
                  a.device.deviceId === 'default' ||
                  b.device.deviceId === 'default'
                )
                  return 1;
                if (a.device.label < b.device.label) return -1;
                if (a.device.label > b.device.label) return 1;
                return 0;
              })
          );
          set(
            speakerDevicesState,
            speakers
              .filter(Boolean)
              .map<StatefulDevice>((d) => ({
                device: d,
                selected:
                  'deviceId' in speaker && d.deviceId === speaker.deviceId,
                state: 'granted',
              }))
              .sort((a, b) => {
                if (
                  a.device.deviceId === 'default' ||
                  b.device.deviceId === 'default'
                )
                  return 1;
                if (a.device.label < b.device.label) return -1;
                if (a.device.label > b.device.label) return 1;
                return 0;
              })
          );
        } catch (e) {
          set(generalCameraState, 'not-supported');
          set(generalMicrophoneState, 'not-supported');
        }
      },
    [daily]
  );

  const updateDeviceStates = useRecoilCallback(
    ({ set, snapshot }) =>
      async () => {
        if (!daily) return;

        const { tracks } = daily.participants().local;

        const cams = await snapshot.getPromise(cameraDevicesState);
        const mics = await snapshot.getPromise(microphoneDevicesState);

        if (tracks.audio?.blocked?.byDeviceInUse) {
          if (micDevices.some((m) => m.selected)) {
            set(
              microphoneDevicesState,
              mics.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'in-use' } : m
              )
            );
          } else {
            set(generalMicrophoneState, 'in-use');
          }
        } else if (tracks.audio?.blocked?.byDeviceMissing) {
          set(generalMicrophoneState, 'not-found');
        } else if (tracks.audio?.blocked?.byPermissions) {
          if (micDevices.some((m) => m.selected)) {
            set(
              microphoneDevicesState,
              mics.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'blocked' } : m
              )
            );
          } else {
            set(generalMicrophoneState, 'blocked');
          }
        } else {
          refreshDevices();
          if (micDevices.some((m) => m.selected)) {
            set(
              microphoneDevicesState,
              mics.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'granted' } : m
              )
            );
          } else {
            set(generalMicrophoneState, 'granted');
          }
        }

        if (tracks.video?.blocked?.byDeviceInUse) {
          if (camDevices.some((m) => m.selected)) {
            set(
              cameraDevicesState,
              cams.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'in-use' } : m
              )
            );
          } else {
            set(generalCameraState, 'in-use');
          }
        } else if (tracks.video?.blocked?.byDeviceMissing) {
          set(generalCameraState, 'not-found');
        } else if (tracks.video?.blocked?.byPermissions) {
          if (camDevices.some((m) => m.selected)) {
            set(
              cameraDevicesState,
              cams.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'blocked' } : m
              )
            );
          } else {
            set(generalCameraState, 'blocked');
          }
        } else {
          refreshDevices();
          if (camDevices.some((m) => m.selected)) {
            set(
              cameraDevicesState,
              cams.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'granted' } : m
              )
            );
          } else {
            set(generalCameraState, 'granted');
          }
        }
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

  useDailyEvent(
    'camera-error',
    useRecoilCallback(
      ({ set }) =>
        ({
          errorMsg: { errorMsg, audioOk, videoOk },
          error,
        }: DailyEventObjectCameraError) => {
          switch (error?.type) {
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
            default:
              switch (errorMsg) {
                case 'devices error':
                  if (!videoOk) set(generalCameraState, 'not-found');
                  if (!audioOk) set(generalMicrophoneState, 'not-found');
                  break;
                case 'not allowed': {
                  updateDeviceStates();
                  break;
                }
              }
              break;
          }
        },
      [updateDeviceStates]
    )
  );

  useDailyEvent(
    'error',
    useCallback(
      ({ errorMsg }: DailyEventObjectFatalError) => {
        switch (errorMsg) {
          case 'not allowed': {
            updateDeviceStates();
            break;
          }
        }
      },
      [updateDeviceStates]
    )
  );

  useDailyEvent(
    'started-camera',
    useCallback(() => {
      updateDeviceStates();
    }, [updateDeviceStates])
  );

  /**
   * Sets video input device to given deviceId.
   */
  const setCamera = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        videoDeviceId: deviceId,
      });
      refreshDevices();
    },
    [daily, refreshDevices]
  );

  /**
   * Sets audio input device to given deviceId.
   */
  const setMicrophone = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        audioDeviceId: deviceId,
      });
      refreshDevices();
    },
    [daily, refreshDevices]
  );

  /**
   * Sets audio output device to given deviceId.
   */
  const setSpeaker = useCallback(
    async (deviceId: string) => {
      daily?.setOutputDevice({
        outputDeviceId: deviceId,
      });
      refreshDevices();
    },
    [daily, refreshDevices]
  );

  return {
    camError: ['blocked', 'in-use', 'not-found'].includes(camState),
    camState,
    cameras: camDevices,
    setCamera,
    micError: ['blocked', 'in-use', 'not-found'].includes(micState),
    micState,
    microphones: micDevices,
    setMicrophone,
    speakers: speakerDevices,
    setSpeaker,
    refreshDevices,
  };
};
