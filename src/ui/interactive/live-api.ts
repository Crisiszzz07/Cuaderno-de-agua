import type { LiveSnapshot, LiveSubmission } from '../../domain/live-activity.ts';

export class LiveApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
async function request<T>(path: string, method = 'GET', value?: unknown, key?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (value !== undefined) headers['Content-Type'] = 'application/json';
  if (key) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(`/api/live${path}`, { method, headers, body: value === undefined ? undefined : JSON.stringify(value), credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!response.headers.get('Content-Type')?.includes('application/json')) throw new LiveApiError(503, 'La actividad en vivo no está disponible en este alojamiento. Puedes usar la actividad local.');
  const result = await response.json();
  if (!response.ok) throw new LiveApiError(response.status, typeof result.error === 'string' ? result.error : 'No se pudo completar la solicitud.');
  return result as T;
}
export const liveApi = {
  create: () => request<{ code: string; hostKey: string; snapshot: LiveSnapshot }>('/sessions', 'POST', {}),
  state: (code: string, key?: string) => request<LiveSnapshot>(`/sessions/${encodeURIComponent(code)}`, 'GET', undefined, key),
  join: (code: string) => request<{ participantKey: string; snapshot: LiveSnapshot }>(`/sessions/${encodeURIComponent(code)}/join`, 'POST', {}),
  submit: (code: string, value: LiveSubmission, key: string) => request<{ submitted: true }>(`/sessions/${encodeURIComponent(code)}/answers`, 'POST', value, key),
  end: (code: string, key: string) => request<{ ended: boolean }>(`/sessions/${encodeURIComponent(code)}`, 'DELETE', undefined, key),
};
export function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export function reportError(error: unknown) {
  return error instanceof LiveApiError ? error.message : 'Se perdió la conexión. Las respuestas permanecen solo en esta página; intenta de nuevo.';
}
