import { env } from 'cloudflare:workers';
import { initialState, type AppState } from '../domain/model';
import { normalizeState } from '../domain/sets';
import { records, recommend } from '../domain/progression';
export class Conflict extends Error {
}
const tables = ['exercises', 'routines', 'workout_days', 'routine_exercises', 'workout_sessions', 'exercise_sessions', 'sets', 'body_measurements', 'personal_records', 'exercise_progressions'] as const;
type Row = {
    id: string;
    parent_id: string | null;
    position: number;
    data: string;
};
type Flat = Record<string, Row[]>;
// Actual stored rows, before read-time compatibility upgrade.
const loadedRows = new WeakMap<AppState, Flat>();
const db = () => { const DB = (env as unknown as {
    DB: D1Database;
}).DB; if (!DB)
    throw Error('Database unavailable'); return DB; };
function flatten(s: AppState): Flat {
    const f: Flat = Object.fromEntries(tables.map(t => [t, []]));
    const add = (t: string, data: any, parent: string | null = null, position = 0) => f[t].push({ id: data.id, parent_id: parent, position, data: JSON.stringify(data) });
    s.exercises.forEach((e, i) => add('exercises', e, null, i));
    s.routines.forEach((r, i) => { const { days, ...rest } = r; add('routines', rest, null, i); days.forEach((d, j) => { const { exercises, ...day } = d; add('workout_days', day, r.id, j); exercises.forEach((e, k) => add('routine_exercises', e, d.id, k)); }); });
    s.sessions.forEach((s, i) => { const { exercises, ...session } = s; add('workout_sessions', session, null, i); exercises.forEach((e, j) => { const { sets, ...ex } = e; add('exercise_sessions', ex, s.id, j); sets.forEach((set, k) => add('sets', set, e.id, k)); }); });
    s.measurements.forEach((m, i) => add('body_measurements', m, null, i));
    records(s.sessions).forEach(r => add('personal_records', { id: r.exerciseId, ...r }));
    s.routines.forEach(r => r.days.forEach(d => d.exercises.forEach(e => add('exercise_progressions', { id: e.id, ...recommend(e, s.sessions) }))));
    return f;
}
function writes(database: D1Database, user: string, op: string, before: Flat, after: Flat) { const queries: D1PreparedStatement[] = []; for (const t of tables) {
    const prev = new Map((before[t] ?? []).map(r => [r.id, r]));
    for (const r of after[t]) {
        const p = prev.get(r.id);
        prev.delete(r.id);
        if (p && JSON.stringify(p) === JSON.stringify(r))
            continue;
        queries.push(database.prepare(`INSERT INTO ${t}(id,user_id,parent_id,position,data) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND operation=?) ON CONFLICT(user_id,id) DO UPDATE SET parent_id=excluded.parent_id,position=excluded.position,data=excluded.data`).bind(r.id, user, r.parent_id, r.position, r.data, user, op));
    }
    for (const id of prev.keys())
        queries.push(database.prepare(`DELETE FROM ${t} WHERE user_id=? AND id=? AND EXISTS(SELECT 1 FROM users WHERE id=? AND operation=?)`).bind(user, id, user, op));
} return queries; }
export async function load(user: string): Promise<AppState> {
    const database = db();
    let results = await database.batch([database.prepare('SELECT version,settings FROM users WHERE id=?').bind(user), ...tables.map(t => database.prepare(`SELECT id,parent_id,position,data FROM ${t} WHERE user_id=? ORDER BY position`).bind(user))]);
    if (!results[0].results.length) {
        const initial = initialState(), op = crypto.randomUUID();
        await database.batch([database.prepare('INSERT OR IGNORE INTO users(id,version,operation,settings) VALUES(?,?,?,?)').bind(user, 0, op, JSON.stringify(initial.settings)), ...writes(database, user, op, {}, flatten(initial))]);
        return load(user);
    }
    const account = results[0].results[0] as any;
    const f: Flat = Object.fromEntries(tables.map((t, i) => [t, results[i + 1].results as unknown as Row[]]));
    const parse = (t: string, parent?: string) => f[t].filter(r => parent === undefined || r.parent_id === parent).map(r => JSON.parse(r.data));
    const state = normalizeState({ version: account.version, settings: JSON.parse(account.settings), exercises: parse('exercises'), routines: parse('routines').map(r => ({ ...r, days: parse('workout_days', r.id).map(d => ({ ...d, exercises: parse('routine_exercises', d.id) })) })), sessions: parse('workout_sessions').map(s => ({ ...s, exercises: parse('exercise_sessions', s.id).map(e => ({ ...e, sets: parse('sets', e.id) })) })), measurements: parse('body_measurements') });
    loadedRows.set(state, f);
    return state;
}
export async function save(user: string, before: AppState, after: AppState) { const database = db(), op = crypto.randomUUID(); const result = await database.batch([database.prepare('UPDATE users SET version=?, operation=?, settings=? WHERE id=? AND version=?').bind(after.version, op, JSON.stringify(after.settings), user, before.version), ...writes(database, user, op, loadedRows.get(before) ?? flatten(before), flatten(after))]); if (result[0].meta.changes !== 1)
    throw new Conflict('Hay cambios desde otro dispositivo. Recarga antes de guardar.'); }
