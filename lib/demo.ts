import { initialState, uid, type AppState } from './domain/model';
import { reduce, type Action } from './domain/actions';
import { normalizeState } from './domain/sets';

// Device-local, synthetic data only. This adapter never contacts private APIs.
export const DEMO_KEY = 'fuerza-base:demo:v1';
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

export function createDemo(): AppState {
    let state = structuredClone(initialState());
    state.routines[0].name = 'Fuerza Base A/B · Demo';
    state.routines[0].days.forEach(day => day.exercises.forEach((e, i) => {
        e.targetSets = [3, 4, 3, 3, 2][i];
    }));
    for (let day = 0; day < 4; day++) {
        state = reduce(state, { type: 'start' });
        const session = state.sessions.at(-1)!;
        for (const exercise of session.exercises) {
            for (const set of exercise.sets) {
                state = reduce(state, { type: 'saveSet', sessionId: session.id, exerciseId: exercise.id,
                    set: { id: set.id, weight: exercise.config.type === 'bodyweight' ? 0 : 20 + day * 2.5,
                        reps: 8, rir: 2, savedAt: new Date().toISOString() } });
            }
        }
        state = reduce(state, { type: 'finish', id: session.id });
        const saved = state.sessions.at(-1)!;
        const date = new Date(); date.setDate(date.getDate() - (10 - day * 2));
        saved.startedAt = date.toISOString();
        saved.finishedAt = new Date(date.getTime() + 45 * 60000).toISOString();
        saved.exercises.forEach(e => e.sets.forEach(s => s.savedAt = saved.finishedAt));
        state.measurements.push({ id: uid(), date: date.toISOString().slice(0, 10), weight: 78 - day * .2, waist: 92 - day * .3 });
    }
    state.version = 0;
    return state;
}

export function resetDemo(storage: Storage): AppState {
    const state = createDemo();
    storage.setItem(DEMO_KEY, JSON.stringify(state));
    return state;
}

export function loadDemo(storage: Storage): AppState {
    const raw = storage.getItem(DEMO_KEY);
    if (!raw) return resetDemo(storage);
    try {
        const state = JSON.parse(raw);
        if (!Number.isInteger(state.version) || !Array.isArray(state.routines) || !Array.isArray(state.sessions)
            || !Array.isArray(state.measurements) || !Array.isArray(state.exercises) || !state.settings) throw Error();
        return normalizeState(state);
    } catch {
        throw Error('No se pueden leer las pruebas guardadas. Usa «Restablecer demo» para empezar de nuevo.');
    }
}

export function saveDemo(storage: Storage, before: AppState, action: Action): AppState {
    const current = loadDemo(storage);
    if (current.version !== before.version) throw Error('La demo ha cambiado en otra pestaña. Recarga antes de guardar.');
    const after = reduce(before, action);
    storage.setItem(DEMO_KEY, JSON.stringify(after));
    return after;
}
