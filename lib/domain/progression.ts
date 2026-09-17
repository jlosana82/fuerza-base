import type { AppState, ExerciseProgression, PersonalRecord, RoutineExercise, SetRecord, WorkoutSession } from './model';
import { workingSets, programmedSets } from './sets';
export const epley = (weight: number, reps: number) => weight * (1 + reps / 30);
export const volume = (sets: SetRecord[]) => workingSets(sets).reduce((n, s) => n + s.weight * s.reps, 0);
export function previous(sessions: WorkoutSession[], exerciseId: string) { return [...sessions].filter(s => s.status === 'complete').sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? '')).flatMap(s => s.exercises).find(e => e.config.exerciseId === exerciseId && workingSets(e.sets).length > 0); }
export function recommend(c: RoutineExercise, sessions: WorkoutSession[]): ExerciseProgression {
    const last = previous(sessions, c.exerciseId);
    if (!last)
        return { weight: 0, reps: Array(c.targetSets).fill(c.min), reason: 'Primera sesión: elige una carga que deje el RIR indicado.', kind: 'start' };
    const sets = programmedSets(last.sets);
    if (!sets.length) return { weight: 0, reps: Array(c.targetSets).fill(c.min), reason: 'La última sesión no tiene series programadas realizadas. Elige una carga con el RIR indicado.', kind: 'start' };
    const sameTarget = last.config.targetSets === c.targetSets;
    const weight = sets[0].weight, uniform = sets.every(s => s.weight === weight), failed = sets.filter(s => s.reps < c.min - 1).length >= 2 || sets.filter(s => s.rir === 0).length >= 2;
    if (failed && weight > 0)
        return { weight: Math.max(0, Math.round((weight - c.increment) * 100) / 100), reps: Array(c.targetSets).fill(c.min), reason: 'Varias series al límite o por debajo del rango. Prueba un incremento menos.', kind: 'reduce' };
    if (sameTarget && uniform && sets.length === last.config.targetSets && sets.every(s => s.reps >= c.max && s.rir >= c.rirMin))
        return { weight: Math.round((weight + c.increment) * 100) / 100, reps: Array(c.targetSets).fill(c.min), reason: 'Todas las series en el máximo con margen suficiente. Sube la carga y vuelve al mínimo.', kind: 'increase' };
    return { weight, reps: Array.from({ length: c.targetSets }, (_, i) => Math.min(c.max, Math.max(c.min, (sets[i]?.reps ?? c.min) + (sets[i]?.rir >= c.rirMin ? 1 : 0)))), reason: !sameTarget ? 'Ha cambiado el número de series programadas. Consolida el nuevo objetivo antes de subir la carga.' : sets.length < last.config.targetSets ? 'Faltaron series programadas. Mantén la carga y completa el objetivo antes de subir.' : uniform ? 'Mantén la carga. Suma repeticiones sin bajar del RIR objetivo.' : 'La carga varió entre series. Usa la primera como referencia y consolida el rango.', kind: 'maintain' };
}
export function records(sessions: WorkoutSession[]): PersonalRecord[] { const out: Record<string, PersonalRecord> = {}; for (const s of sessions.filter(s => s.status === 'complete')) {
    const sessionVolume: Record<string, number> = {};
    for (const e of s.exercises) {
        if (!workingSets(e.sets).length)
            continue;
        const id = e.config.exerciseId, r = out[id] ?? { exerciseId: id, weight: 0, e1rm: 0, volume: 0, repsByWeight: {} };
        for (const set of workingSets(e.sets)) {
            r.weight = Math.max(r.weight, set.weight);
            if (e.config.type !== 'bodyweight')
                r.e1rm = Math.max(r.e1rm, epley(set.weight, set.reps));
            r.repsByWeight[String(set.weight)] = Math.max(r.repsByWeight[String(set.weight)] ?? 0, set.reps);
        }
        sessionVolume[id] = (sessionVolume[id] ?? 0) + volume(e.sets);
        out[id] = r;
    }
    for (const [id, v] of Object.entries(sessionVolume))
        out[id].volume = Math.max(out[id].volume, v);
} return Object.values(out); }
export function newRecordNames(before: AppState, after: AppState) { const old = records(before.sessions), now = records(after.sessions); return now.filter(r => { const p = old.find(x => x.exerciseId === r.exerciseId); return !p || r.weight > p.weight || r.e1rm > p.e1rm || r.volume > p.volume || Object.entries(r.repsByWeight).some(([w, n]) => n > (p.repsByWeight[w] ?? 0)); }).map(r => after.exercises.find(e => e.id === r.exerciseId)?.name ?? 'Ejercicio'); }
