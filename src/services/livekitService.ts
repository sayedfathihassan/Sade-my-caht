import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  LocalTrackPublication,
  LocalParticipant,
  Track,
} from 'livekit-client';

class LiveKitService {
  private room: Room | null = null;
  private onMessageCallback: ((uid: string, message: string) => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;
  private isIntentionalDisconnect = false;

  async join(url: string, token: string) {
    if (this.room) {
      await this.leave();
    }

    this.isIntentionalDisconnect = false;

    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    this.room
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          track.attach();
        }
      })
      .on(RoomEvent.DataReceived, (payload, participant) => {
        if (this.onMessageCallback && participant) {
          const message = new TextDecoder().decode(payload);
          this.onMessageCallback(participant.identity, message);
        }
      })
      .on(RoomEvent.Disconnected, () => {
        if (!this.isIntentionalDisconnect && this.onDisconnectedCallback) {
          this.onDisconnectedCallback();
        }
      });

    await this.room.connect(url, token);
  }

  async publish() {
    if (!this.room) return;
    await this.room.localParticipant.setMicrophoneEnabled(true);
  }

  async unpublish() {
    if (!this.room) return;
    await this.room.localParticipant.setMicrophoneEnabled(false);
  }

  async leave() {
    if (this.room) {
      this.isIntentionalDisconnect = true;
      await this.room.disconnect();
      this.room = null;
    }
  }

  sendMessage(message: string) {
    if (!this.room) return;
    const data = new TextEncoder().encode(message);
    this.room.localParticipant.publishData(data, { reliable: true });
  }

  onMessage(callback: (uid: string, message: string) => void) {
    this.onMessageCallback = callback;
  }

  clearMessageCallback() {
    this.onMessageCallback = null;
  }

  onDisconnected(callback: () => void) {
    this.onDisconnectedCallback = callback;
  }

  clearDisconnectedCallback() {
    this.onDisconnectedCallback = null;
  }

  setMuted(muted: boolean) {
    if (this.room) {
      this.room.localParticipant.setMicrophoneEnabled(!muted);
    }
  }
}

export const livekitService = new LiveKitService();
