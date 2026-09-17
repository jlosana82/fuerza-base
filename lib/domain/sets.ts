import { uid, type AppState, type ExerciseSession, type RoutineExercise, type SetRecord, type SetType, type WorkoutSession } from './model';

export function newSet(type: SetType, id = uid()): SetRecord {
    return { id, type, status: 'pending', weight: 0, reps: 0, rir: 0, savedAt: null };
}
export function createExerciseSession(config: RoutineExercise): ExerciseSession {
    return { id: uid(), config: structuredClone(config), setsVersion: 2,
        sets: Array.from({ length: config.targetSets }, () => newSet('programmed')) };
}
export const performedSets = (sets: SetRecord[]) => sets.filter(s => s.status === 'completed');
export const workingSets = (sets: SetRecord[]) => performedSets(sets).filter(s => s.type !== 'warmup');
export const programmedSets = (sets: SetRecord[]) => performedSets(sets).filter(s => s.type === 'programmed');
export const visibleSets = (sets: SetRecord[]) => sets.filter(s => s.status !== 'removed');
export const pendingSets = (sets: SetRecord[]) => sets.filter(s => s.status === 'pending');
export const setTypeLabel = (type: SetType) => type === 'additional' ? 'Serie adicional' : type === 'warmup' ? 'Calentamiento' : 'Programada';
export function exerciseProgress(exercise: ExerciseSession) {
    const target = exercise.config.targetSets;
    const done = programmedSets(exercise.sets).length;
    return { target, done, complete: done >= target, pending: pendingSets(exercise.sets).length };
}
export function sessionProgress(session: WorkoutSession) {
    const target = session.exercises.reduce((n, e) => n + e.config.targetSets, 0);
    const sets = session.exercises.flatMap(e => e.sets);
    const done = programmedSets(sets).length;
    return { target, done, additional: performedSets(sets).filter(s => s.type === 'additional').length,
        performed: workingSets(sets).length, warmups: performedSets(sets).filter(s => s.type === 'warmup').length,
        percent: target > 0 ? Math.min(100, done / target * 100) : 0 };
}

function normalizeConfig(config: RoutineExercise): RoutineExercise {
    const { sets: legacySets, ...rest } = config as RoutineExercise & { sets?: number };
    const targetSets = rest.targetSets ?? legacySets;
    if (!Number.isInteger(targetSets) || (targetSets ?? 0) < 1) throw Error('Configuración de series inválida.');
    return { ...rest, targetSets: targetSets! };
}
/** Pure, idempotent compatibility upgrade. Existing record IDs and values remain intact.
 * Stable IDs make synthesized pending rows survive retries until their first atomic write.
 */
export function normalizeState(input: AppState): AppState {
    const state = structuredClone(input);
    state.routines.forEach(r => r.days.forEach(d => { d.exercises = d.exercises.map(normalizeConfig); }));
    state.sessions.forEach(session => session.exercises.forEach(exercise => {
        exercise.config = normalizeConfig(exercise.config);
        if (exercise.setsVersion === 2) return;
        exercise.sets = exercise.sets.map((set, i) => ({ ...set,
            type: set.type ?? (i < exercise.config.targetSets ? 'programmed' : 'additional'),
            status: set.status ?? 'completed' }));
        if (session.status === 'active') {
            const existing = exercise.sets.filter(s => s.type === 'programmed').length;
            for (let i = existing; i < exercise.config.targetSets; i++) {
                exercise.sets.push(newSet('programmed', `pending:${exercise.id}:${i}`));
            }
        }
        exercise.setsVersion = 2;
    }));
    return state;
}
