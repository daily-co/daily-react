import { DailyStreamingLayoutConfig } from '@daily-co/daily-js';
import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback, useEffect } from 'react';

import { useDailyEvent } from './hooks/useDailyEvent';
import { useLocalSessionId } from './hooks/useLocalSessionId';
import { useParticipantIds } from './hooks/useParticipantIds';
import { customDeepEqual } from './lib/customDeepEqual';
import { jotaiDebugLabel } from './lib/jotai-custom';

export interface RecordingInstanceState {
  error?: boolean;
  errorMsg?: string;
  instanceId: string;
  isLocalParticipantRecorded: boolean;
  isRecording: boolean;
  layout?: DailyStreamingLayoutConfig;
  local?: boolean;
  recordingId?: string;
  recordingStartedDate?: Date;
  startedBy?: string;
  type?: string;
}

interface RecordingState {
  /**
   * Whether any recording instance has an error.
   * With multiple concurrent instances, use useRecording({ instanceId }) for per-instance error state.
   */
  error?: boolean;
  isLocalParticipantRecorded: boolean;
  isRecording: boolean;
  /**
   * Layout of the first active recording instance.
   * With multiple concurrent instances, use useRecording({ instanceId }) for per-instance layout.
   */
  layout?: DailyStreamingLayoutConfig;
  local?: boolean;
  /**
   * Recording ID of the first active instance.
   * With multiple concurrent instances, use useRecording({ instanceId }) for per-instance recordingId.
   */
  recordingId?: string;
  /**
   * Start date of the first active instance.
   * With multiple concurrent instances, use useRecording({ instanceId }) for per-instance recordingStartedDate.
   */
  recordingStartedDate?: Date;
  /**
   * Starter of the first active instance.
   * With multiple concurrent instances, use useRecording({ instanceId }) for per-instance startedBy.
   */
  startedBy?: string;
  /**
   * Recording type of the first active instance.
   * With multiple concurrent instances, use useRecording({ instanceId }) for per-instance type.
   */
  type?: string;
}

function resolveInstanceKey(ev: {
  instanceId?: string;
  type?: string;
  local?: boolean;
}): string {
  if (ev.instanceId) return ev.instanceId;
  if (ev.type === 'local' || ev.local) return '__local__';
  return '__default__';
}

export const recordingInstancesState = atom<
  Record<string, RecordingInstanceState>
>({});
recordingInstancesState.debugLabel = jotaiDebugLabel('recording-instances');

export const recordingState = atom<RecordingState>((get) => {
  const instances = get(recordingInstancesState);
  const values = Object.values(instances);
  const activeInstances = values.filter((v) => v.isRecording);
  const firstActive = activeInstances[0] ?? values[values.length - 1];
  return {
    error: values.some((v) => v.error),
    isLocalParticipantRecorded: values.some(
      (v) => v.isLocalParticipantRecorded
    ),
    isRecording: activeInstances.length > 0,
    layout: firstActive?.layout,
    local: firstActive?.local,
    recordingId: firstActive?.recordingId,
    recordingStartedDate: firstActive?.recordingStartedDate,
    startedBy: firstActive?.startedBy,
    type: firstActive?.type,
  };
});
recordingState.debugLabel = jotaiDebugLabel('recording-state');

export const DailyRecordings: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const localSessionId = useLocalSessionId();

  const recordingParticipantIds = useParticipantIds({
    filter: 'record',
  });

  const maybeUpdateLocalRecordingState = useAtomCallback(
    useCallback(
      (
        get,
        set,
        hasRecordingParticipants: boolean,
        isLocalParticipantRecording: boolean
      ) => {
        const instances = get(recordingInstancesState);
        const localInstance = instances['__local__'];

        const newLocalState: RecordingInstanceState = {
          instanceId: '__local__',
          isLocalParticipantRecorded: hasRecordingParticipants,
          isRecording: hasRecordingParticipants,
          local: hasRecordingParticipants
            ? isLocalParticipantRecording
            : localInstance?.local,
          type: hasRecordingParticipants ? 'local' : localInstance?.type,
        };

        if (localInstance && customDeepEqual(localInstance, newLocalState))
          return;

        if (!hasRecordingParticipants && !localInstance) return;

        if (hasRecordingParticipants) {
          set(recordingInstancesState, (prev) => ({
            ...prev,
            __local__: newLocalState,
          }));
        } else if (localInstance) {
          set(recordingInstancesState, (prev) => ({
            ...prev,
            __local__: {
              ...localInstance,
              isLocalParticipantRecorded: false,
              isRecording: false,
            },
          }));
        }
      },
      []
    )
  );

  useEffect(() => {
    const hasRecordingParticipants = recordingParticipantIds.length > 0;
    const isLocalParticipantRecording = recordingParticipantIds.includes(
      localSessionId || 'local'
    );
    maybeUpdateLocalRecordingState(
      hasRecordingParticipants,
      isLocalParticipantRecording
    );
  }, [localSessionId, maybeUpdateLocalRecordingState, recordingParticipantIds]);

  useDailyEvent(
    'recording-started',
    useAtomCallback(
      useCallback(
        (_get, set, ev) => {
          const key = resolveInstanceKey(ev);
          let isLocalParticipantRecorded = true;
          switch (ev.type) {
            case 'cloud-audio-only':
            case 'cloud-beta':
            case 'cloud': {
              if (
                localSessionId &&
                ev.layout?.preset === 'single-participant' &&
                ev.layout.session_id !== localSessionId
              ) {
                isLocalParticipantRecorded = false;
              }
              break;
            }
          }
          set(recordingInstancesState, (prev) => ({
            ...prev,
            [key]: {
              error: false,
              instanceId: key,
              isLocalParticipantRecorded,
              isRecording: true,
              layout: ev?.layout,
              local: ev?.local,
              recordingId: ev?.recordingId,
              recordingStartedDate: new Date(),
              startedBy: ev?.startedBy,
              type: ev?.type,
            },
          }));
        },
        [localSessionId]
      )
    )
  );
  useDailyEvent(
    'recording-stopped',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveInstanceKey(ev);
        set(recordingInstancesState, (prev) => {
          if (!prev[key]) return prev;
          return {
            ...prev,
            [key]: {
              ...prev[key],
              isLocalParticipantRecorded: false,
              isRecording: false,
            },
          };
        });
      }, [])
    )
  );
  useDailyEvent(
    'recording-error',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveInstanceKey(ev);
        set(recordingInstancesState, (prev) => {
          const existing = prev[key];
          return {
            ...prev,
            [key]: {
              ...(existing ?? {
                instanceId: key,
              }),
              error: true,
              errorMsg: ev.errorMsg,
              isLocalParticipantRecorded: false,
              isRecording: false,
            },
          };
        });
      }, [])
    )
  );
  useDailyEvent(
    'left-meeting',
    useAtomCallback(
      useCallback((_get, set) => {
        set(recordingInstancesState, {});
      }, [])
    )
  );
  return <>{children}</>;
};
