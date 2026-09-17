import { z } from 'zod';
import { uid, type AppState, type Routine, type WorkoutSession } from './model';
import { createExerciseSession, newSet, normalizeState, workingSets } from './sets';
const str = z.string().trim().min(1).max(160), num = (min: number, max: number) => z.number().finite().min(min).max(max);
const exercise = z.object({ id: str, name: str, group: str, equipment: str, notes: z.string().max(2000), type: z.enum(['loaded', 'bodyweight']) });
const re = z.object({ id: str, exerciseId: str, name: str, group: str, type: z.enum(['loaded', 'bodyweight']), targetSets: num(1, 100).int(), min: num(1, 100).int(), max: num(1, 100).int(), rirMin: num(0, 5).int(), rirMax: num(0, 5).int(), increment: num(.01, 100), rest: num(0, 1800).int(), notes: z.string().max(2000) }).refine(v => v.max >= v.min && v.rirMax >= v.rirMin, 'Rangos de repeticiones o RIR inválidos');
const routine = z.object({ id: str, name: str, description: z.string().max(2000), createdAt: str, status: z.enum(['active', 'draft', 'archived']), nextDay: num(0, 99).int(), days: z.array(z.object({ id: str, name: str, exercises: z.array(re).min(1).max(30) })).min(1).max(14) });
const measurement = z.object({ id: str, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), weight: num(1, 500).optional(), waist: num(1, 300).optional(), chest: num(1, 300).optional(), arm: num(1, 150).optional(), thigh: num(1, 200).optional(), neck: num(1, 100).optional(), fat: num(1, 75).optional() }).refine(v => Object.keys(v).length > 2, 'Introduce al menos una medida');
export const actionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('saveRoutine'), routine }), z.object({ type: z.literal('activate'), id: str }), z.object({ type: z.literal('archive'), id: str }), z.object({ type: z.literal('deleteRoutine'), id: str }), z.object({ type: z.literal('duplicate'), id: str }), z.object({ type: z.literal('saveExercise'), exercise }), z.object({ type: z.literal('start') }), z.object({ type: z.literal('saveSet'), sessionId: str, exerciseId: str, set: z.object({ id: str, weight: num(0, 1500), reps: num(1, 100).int(), rir: num(0, 5).int(), savedAt: str }) }), z.object({ type: z.literal('addSet'), sessionId: str, exerciseId: str, id: str, setType: z.enum(['additional', 'warmup']).default('additional') }), z.object({ type: z.literal('removeSet'), sessionId: str, exerciseId: str, setId: str, confirmed: z.boolean().optional() }), z.object({ type: z.literal('finish'), id: str }), z.object({ type: z.literal('cancel'), id: str }), z.object({ type: z.literal('restart'), id: str }), z.object({ type: z.literal('timer'), id: str, restUntil: z.number().nullable(), restRemaining: z.number().nullable() }), z.object({ type: z.literal('measure'), measurement }), z.object({ type: z.literal('settings'), settings: z.object({ unit: z.enum(['kg', 'lb']), increment: num(.01, 100), timer: z.boolean(), theme: z.enum(['dark', 'light']), weekStart: z.enum(['monday', 'sunday']), showRir: z.boolean(), dateFormat: z.enum(['es', 'iso']), weeklyGoal: num(1, 7).int() }) })
]);
export type Action = z.infer<typeof actionSchema>;
export function reduce(state: AppState, raw: unknown): AppState {
    const a = actionSchema.parse(raw), s = normalizeState(state);
    const active = s.sessions.find(x => x.status === 'active');
    const getRoutine = (id: string) => { const r = s.routines.find(x => x.id === id); if (!r)
        throw Error('La rutina ya no existe.'); return r; };
    const getSession = (id: string) => { const x = s.sessions.find(x => x.id === id && x.status === 'active'); if (!x)
        throw Error('La sesión ya no está activa.'); return x; };
    switch (a.type) {
        case 'saveRoutine': {
            const r = a.routine;
            if (new Set(r.days.map(d => d.id)).size !== r.days.length || new Set(r.days.flatMap(d => d.exercises.map(e => e.id))).size !== r.days.flatMap(d => d.exercises).length)
                throw Error('Identificadores duplicados.');
            if (r.days.some(d => d.exercises.some(e => !s.exercises.some(x => x.id === e.exerciseId))))
                throw Error('Ejercicio desconocido.');
            if (r.status === 'active')
                s.routines.forEach(x => { if (x.id !== r.id && x.status === 'active')
                    x.status = 'draft'; });
            r.nextDay %= r.days.length;
            s.routines = s.routines.filter(x => x.id !== r.id).concat(r as Routine);
            break;
        }
        case 'activate':
            getRoutine(a.id);
            s.routines.forEach(r => { r.status = r.id === a.id ? 'active' : r.status === 'active' ? 'draft' : r.status; });
            break;
        case 'archive':
            getRoutine(a.id).status = 'archived';
            break;
        case 'deleteRoutine':
            getRoutine(a.id);
            if (active?.routineId === a.id)
                throw Error('Termina o cancela la sesión antes de eliminar esta rutina.');
            s.routines = s.routines.filter(r => r.id !== a.id);
            break;
        case 'duplicate': {
            const r = structuredClone(getRoutine(a.id));
            r.id = uid();
            r.name += ' · copia';
            r.createdAt = new Date().toISOString();
            r.status = 'draft';
            r.nextDay = 0;
            r.days.forEach(d => { d.id = uid(); d.exercises.forEach(e => e.id = uid()); });
            s.routines.push(r);
            break;
        }
        case 'saveExercise':
            s.exercises = s.exercises.filter(e => e.id !== a.exercise.id).concat(a.exercise);
            break;
        case 'start': {
            if (active)
                throw Error('Ya tienes una sesión en curso.');
            const r = s.routines.find(x => x.status === 'active');
            if (!r)
                throw Error('Activa una rutina primero.');
            const d = r.days[r.nextDay % r.days.length];
            s.sessions.push({ id: uid(), routineId: r.id, routineName: r.name, dayId: d.id, dayName: d.name, startedAt: new Date().toISOString(), finishedAt: null, status: 'active', restUntil: null, restRemaining: null, exercises: d.exercises.map(createExerciseSession) });
            break;
        }
        case 'addSet': {
            const session = getSession(a.sessionId);
            const exercise = session.exercises.find(e => e.id === a.exerciseId);
            if (!exercise) throw Error('Ejercicio desconocido.');
            if (s.sessions.some(s => s.exercises.some(e => e.sets.some(set => set.id === a.id)))) throw Error('La serie ya existe.');
            exercise.sets.push(newSet(a.setType, a.id));
            break;
        }
        case 'removeSet': {
            const session = getSession(a.sessionId);
            const exercise = session.exercises.find(e => e.id === a.exerciseId);
            const set = exercise?.sets.find(set => set.id === a.setId);
            if (!set || set.status === 'removed') throw Error('La serie ya no existe.');
            if (set.status === 'completed' && !a.confirmed) throw Error('Confirma la eliminación de la serie registrada.');
            // Keep a tombstone so original programmed intent and audit data survive.
            set.status = 'removed';
            break;
        }
        case 'saveSet': {
            const session = getSession(a.sessionId);
            const exercise = session.exercises.find(e => e.id === a.exerciseId);
            const set = exercise?.sets.find(set => set.id === a.set.id);
            if (!set || set.status === 'removed') throw Error('Esta serie ya no está disponible. Recarga la sesión.');
            const wasPending = set.status === 'pending';
            Object.assign(set, a.set, { status: 'completed', savedAt: new Date().toISOString() });
            // Editing a completed set must not restart a running rest timer.
            if (wasPending) {
                session.restUntil = s.settings.timer ? Date.now() + exercise!.config.rest * 1000 : null;
                session.restRemaining = null;
            }
            break;
        }
        case 'finish': {
            const x = getSession(a.id);
            if (!x.exercises.some(e => workingSets(e.sets).length))
                throw Error('Registra al menos una serie.');
            x.status = 'complete';
            x.finishedAt = new Date().toISOString();
            x.restUntil = null;
            x.restRemaining = null;
            const r = s.routines.find(r => r.id === x.routineId);
            if (r) {
                const i = r.days.findIndex(d => d.id === x.dayId);
                r.nextDay = (i >= 0 ? i + 1 : r.nextDay) % r.days.length;
            }
            break;
        }
        case 'cancel': {
            const x = getSession(a.id);
            x.status = 'cancelled';
            x.finishedAt = new Date().toISOString();
            x.restUntil = null;
            x.restRemaining = null;
            break;
        }
        case 'restart': {
            const x = getSession(a.id);
            x.status = 'cancelled';
            x.finishedAt = new Date().toISOString();
            x.restUntil = null;
            const n: WorkoutSession = { ...structuredClone(x), id: uid(), startedAt: new Date().toISOString(), finishedAt: null, status: 'active', restUntil: null, restRemaining: null, exercises: x.exercises.map(e => createExerciseSession(e.config)) };
            s.sessions.push(n);
            break;
        }
        case 'timer': {
            const x = getSession(a.id);
            x.restUntil = a.restUntil;
            x.restRemaining = a.restRemaining;
            break;
        }
        case 'measure':
            s.measurements = s.measurements.filter(m => m.id !== a.measurement.id).concat(a.measurement).sort((a, b) => a.date.localeCompare(b.date));
            break;
        case 'settings':
            s.settings = a.settings;
            break;
    }
    s.version++;
    return s;
}
