import type { LiveRoom, LiveStore } from '../domain/live-activity.ts';

export class MemoryLiveStore implements LiveStore {
  private rooms = new Map<string, LiveRoom>();
  get size() { return this.rooms.size; }
  get(code: string) { return this.rooms.get(code); }
  set(room: LiveRoom) { this.rooms.set(room.code, room); }
  delete(code: string) { this.rooms.delete(code); }
  purge(now: number) {
    for (const [code, room] of this.rooms) if (now >= room.expiresAt) this.rooms.delete(code);
  }
}
