import type { LiveQuestion, LiveRoom, LiveSnapshot, LiveStore } from '../domain/live-activity.ts';
import { LIVE_ANSWER_MS, LIVE_JOIN_MS, LIVE_MAX_PARTICIPANTS, LIVE_MAX_ROOMS, LIVE_TOTAL_MS } from '../shared/live-constants.ts';
import { scoreLiveSubmission, validateLiveSubmission } from './evaluate-live.ts';

export class LiveActivityError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export class LiveActivity {
  private store: LiveStore;
  private questions: readonly LiveQuestion[];
  private clock: () => number;
  private nonce: () => string;
  constructor(store: LiveStore, questions: readonly LiveQuestion[], clock: () => number, nonce: () => string) {
    this.store = store; this.questions = questions; this.clock = clock; this.nonce = nonce;
  }
  private room(code: string): LiveRoom {
    this.store.purge(this.clock());
    const room = this.store.get(code);
    if (!room) throw new LiveActivityError(404, 'La sesión terminó o no existe. Sus datos se han descartado.');
    return room;
  }
  create() {
    this.store.purge(this.clock());
    if (this.store.size >= LIVE_MAX_ROOMS) throw new LiveActivityError(429, 'Ya hay varias sesiones abiertas. Espera a que termine una.');
    let code = this.nonce().slice(0, 8).toUpperCase();
    while (this.store.get(code)) code = this.nonce().slice(0, 8).toUpperCase();
    const now = this.clock();
    const room: LiveRoom = {
      code, hostKey: this.nonce(), createdAt: now, expiresAt: now + LIVE_TOTAL_MS,
      participants: new Map(),
      statistics: { responses: 0, meanScore: null, correctCounts: this.questions.map(() => 0), optionCounts: this.questions.map(question => question.options.map(() => 0)), scoreCounts: Array(this.questions.length + 1).fill(0), beforeCounts: Array(5).fill(0), afterCounts: Array(5).fill(0) },
    };
    this.store.set(room);
    return { code, hostKey: room.hostKey, snapshot: this.snapshot(code) };
  }
  snapshot(code: string, participantKey?: string): LiveSnapshot {
    const room = this.room(code);
    if (participantKey && !room.participants.has(participantKey)) throw new LiveActivityError(403, 'El acceso temporal no pertenece a esta sesión.');
    const now = this.clock();
    const answerEndsAt = room.createdAt + LIVE_JOIN_MS + LIVE_ANSWER_MS;
    const phase = now < room.createdAt + LIVE_JOIN_MS ? 'joining' : now < answerEndsAt ? 'answering' : 'results';
    return {
      code, phase, serverNow: now, joinEndsAt: room.createdAt + LIVE_JOIN_MS, answerEndsAt, expiresAt: room.expiresAt,
      joined: room.participants.size, submitted: room.statistics.responses,
      ...(participantKey ? { participantSubmitted: room.participants.get(participantKey)!.submitted } : {}),
      questions: this.questions.map(({ id, context, prompt, options }) => ({ id, context, prompt, options })),
      ...(phase === 'results' ? {
        statistics: structuredClone(room.statistics),
        explanations: this.questions.map(({ expected, explanation, citations }) => ({ expected, explanation, citations })),
      } : {}),
    };
  }
  join(code: string) {
    const room = this.room(code);
    if (this.snapshot(code).phase === 'results') throw new LiveActivityError(409, 'El tiempo para responder ya terminó.');
    if (room.participants.size >= LIVE_MAX_PARTICIPANTS) throw new LiveActivityError(429, 'La sesión alcanzó su capacidad.');
    const participantKey = this.nonce();
    room.participants.set(participantKey, { submitted: false });
    return { participantKey, snapshot: this.snapshot(code) };
  }
  submit(code: string, participantKey: string, value: unknown) {
    const room = this.room(code);
    const participant = room.participants.get(participantKey);
    if (!participant) throw new LiveActivityError(403, 'Vuelve a entrar a la sesión desde el QR.');
    if (participant.submitted) return { submitted: true as const };
    if (this.snapshot(code).phase !== 'answering') throw new LiveActivityError(409, 'Esta sesión no está recibiendo respuestas.');
    if (!validateLiveSubmission(value, this.questions)) throw new LiveActivityError(400, 'Completa las tres preguntas y las dos valoraciones de claridad.');
    const score = scoreLiveSubmission(value, this.questions);
    const statistics = room.statistics;
    this.questions.forEach((question, index) => {
      const option = question.options.findIndex(item => item.id === value.answers[index]);
      statistics.optionCounts[index][option]++;
      statistics.correctCounts[index] += Number(question.expected === value.answers[index]);
    });
    statistics.responses++;
    statistics.scoreCounts[score]++;
    statistics.meanScore = statistics.scoreCounts.reduce((sum, count, index) => sum + count * index, 0) / statistics.responses;
    statistics.beforeCounts[value.before - 1]++;
    statistics.afterCounts[value.after - 1]++;
    participant.submitted = true;
    // No individual answers, ratings or score are retained on the server.
    return { submitted: true as const };
  }
  end(code: string, hostKey: string) {
    const room = this.room(code);
    if (room.hostKey !== hostKey) throw new LiveActivityError(403, 'Solo quien abrió esta sesión puede terminarla.');
    this.store.delete(code);
  }
  purge() { this.store.purge(this.clock()); }
}
