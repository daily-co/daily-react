import { DailyCall, DailyParticipant } from "@daily-co/daily-js";


export const emitStartedCamera = (callObject: DailyCall) => {
  // @ts-ignore
  callObject.emit('started-camera', {
    action: 'started-camera',
  });
};

export const emitActiveSpeakerChange = (callObject: DailyCall, peerId: string) => {
  // @ts-ignore
  callObject.emit('active-speaker-change', {
    action: 'active-speaker-change',
    activeSpeaker: {
      peerId,
    },
  });
};

export const emitTrackStarted = (callObject: DailyCall, participant: Partial<DailyParticipant>, track: Partial<MediaStreamTrack>) => {
  // @ts-ignore
  callObject.emit('track-started', {
    action: 'track-started',
    participant,
    track,
  });
};

export const emitParticipantLeft = (callObject: DailyCall, participant: Partial<DailyParticipant>) => {
  // @ts-ignore
  callObject.emit('participant-left', {
    action: 'participant-left',
    participant,
  });
};

export const emitParticipantUpdated = (callObject: DailyCall, participant: Partial<DailyParticipant>) => {
  // @ts-ignore
  callObject.emit('participant-updated', {
    action: 'participant-updated',
    participant,
  });
}

export const emitParticipantJoined = (callObject: DailyCall, participant: Partial<DailyParticipant>) => {
  // @ts-ignore
  callObject.emit('participant-joined', {
    action: 'participant-joined',
    participant,
  });
}

export const emitJoinedMeeting = (callObject: DailyCall, participants: Record<string, Partial<DailyParticipant>>) => {
  // @ts-ignore
  callObject.emit('joined-meeting', {
    action: 'joined-meeting',
    participants,
  });
}

export const emitLeftMeeting = (callObject: DailyCall) => {
  // @ts-ignore
  callObject.emit('left-meeting', {
    action: 'left-meeting',
  });
}