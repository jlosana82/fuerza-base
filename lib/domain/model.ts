export type Exercise = {
    id: string;
    name: string;
    group: string;
    equipment: string;
    notes: string;
    type: 'loaded' | 'bodyweight';
};
export type RoutineExercise = {
    id: string;
    exerciseId: string;
    name: string;
    group: string;
    type: 'loaded' | 'bodyweight';
    targetSets: number;
    min: number;
    max: number;
    rirMin: number;
    rirMax: number;
    increment: number;
    rest: number;
    notes: string;
};
export type WorkoutDay = {
    id: string;
    name: string;
    exercises: RoutineExercise[];
};
export type Routine = {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    status: 'active' | 'draft' | 'archived';
    nextDay: number;
    days: WorkoutDay[];
};
export type SetType = 'programmed' | 'additional' | 'warmup';
export type SetStatus = 'pending' | 'completed' | 'removed';
export type SetRecord = {
    id: string;
    type: SetType;
    status: SetStatus;
    weight: number;
    reps: number;
    rir: number;
    savedAt: string | null;
};
export type ExerciseSession = {
    id: string;
    config: RoutineExercise;
    setsVersion: 2;
    sets: SetRecord[];
};
export type WorkoutSession = {
    id: string;
    routineId: string;
    routineName: string;
    dayId: string;
    dayName: string;
    startedAt: string;
    finishedAt: string | null;
    status: 'active' | 'complete' | 'cancelled';
    exercises: ExerciseSession[];
    restUntil: number | null;
    restRemaining: number | null;
};
export type BodyMeasurement = {
    id: string;
    date: string;
    weight?: number;
    waist?: number;
    chest?: number;
    arm?: number;
    thigh?: number;
    neck?: number;
    fat?: number;
};
export type Settings = {
    unit: 'kg' | 'lb';
    increment: number;
    timer: boolean;
    theme: 'dark' | 'light';
    weekStart: 'monday' | 'sunday';
    showRir: boolean;
    dateFormat: 'es' | 'iso';
    weeklyGoal: number;
};
export type PersonalRecord = {
    exerciseId: string;
    weight: number;
    e1rm: number;
    volume: number;
    repsByWeight: Record<string, number>;
};
export type ExerciseProgression = {
    weight: number;
    reps: number[];
    reason: string;
    kind: 'start' | 'increase' | 'maintain' | 'reduce';
};
export type AppState = {
    version: number;
    exercises: Exercise[];
    routines: Routine[];
    sessions: WorkoutSession[];
    measurements: BodyMeasurement[];
    settings: Settings;
};
export const uid = (): string => {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    // getRandomValues also works in the HTTP preview; keep UUID v4 entropy.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
export const defaults: Settings = { unit: 'kg', increment: 2.5, timer: true, theme: 'dark', weekStart: 'monday', showRir: true, dateFormat: 'es', weeklyGoal: 3 };
export const library: Exercise[] = [['Sentadilla', 'Pierna', 'Barra'], ['Press banca', 'Pecho', 'Barra'], ['Peso muerto', 'Pierna', 'Barra'], ['Press militar', 'Hombro', 'Barra'], ['Remo barra', 'Espalda', 'Barra'], ['Dominadas', 'Espalda', 'Peso corporal'], ['Fondos', 'Pecho', 'Peso corporal'], ['Flexiones', 'Pecho', 'Peso corporal'], ['Zancadas', 'Pierna', 'Mancuernas'], ['Peso muerto rumano', 'Pierna', 'Barra'], ['Hip thrust', 'Glúteo', 'Barra'], ['Face pull', 'Hombro', 'Polea / banda'], ['Curl bíceps', 'Bíceps', 'Mancuernas'], ['Extensión tríceps', 'Tríceps', 'Polea'], ['Elevaciones laterales', 'Hombro', 'Mancuernas'], ['Press inclinado', 'Pecho', 'Barra'], ['Remo mancuerna', 'Espalda', 'Mancuerna'], ['Prensa', 'Pierna', 'Máquina'], ['Curl femoral', 'Pierna', 'Máquina'], ['Extensión cuádriceps', 'Pierna', 'Máquina'], ['Core', 'Core', 'Peso corporal']].map(([name, group, equipment], i) => ({ id: 'ex-' + i, name, group, equipment, notes: '', type: equipment === 'Peso corporal' ? 'bodyweight' : 'loaded' }));
export function config(e: Exercise, increment?: number): RoutineExercise { return { id: uid(), exerciseId: e.id, name: e.name, group: e.group, type: e.type, targetSets: 3, min: 5, max: 8, rirMin: 2, rirMax: 3, increment: increment ?? (e.group === 'Pierna' ? 2.5 : 1.25), rest: 120, notes: '' }; }
export function initialState(): AppState { return { version: 0, exercises: library, routines: [{ id: 'routine-base', name: 'Fuerza Base A/B', description: 'Básicos, doble progresión y margen para recuperar. Alterna los días A y B.', createdAt: new Date().toISOString(), status: 'active', nextDay: 0, days: [[0, 1, 4, 6, 20], [2, 3, 5, 8, 11]].map((ids, i) => ({ id: 'day-' + i, name: 'Día ' + (i ? 'B' : 'A'), exercises: ids.map(n => config(library[n])) })) }], sessions: [], measurements: [], settings: defaults }; }
