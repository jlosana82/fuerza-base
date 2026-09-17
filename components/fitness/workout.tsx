'use client';
import { useState, useEffect } from 'react';
import { Check, Play, Pause, SkipForward, Plus, Minus, ChevronLeft, ChevronRight, Timer, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { uid, type AppState, type WorkoutSession, type SetRecord } from '@/lib/domain/model';
import { previous, recommend } from '@/lib/domain/progression';
import { visibleSets, pendingSets, workingSets, exerciseProgress, sessionProgress, setTypeLabel } from '@/lib/domain/sets';
import { displayWeight, kg } from './shared';
import type { Send } from './routines';

export default function Workout({ state, session, send, busy, close, confirm }: {
    state: AppState; session: WorkoutSession; send: Send; busy: boolean; close: () => void;
    confirm: (title: string, description: string, run: () => void) => void;
}) {
    const [index, setIndex] = useState(() => Math.max(0, session.exercises.findIndex(e => pendingSets(e.sets).length > 0)));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [weight, setWeight] = useState('0'), [reps, setReps] = useState('5'), [rir, setRir] = useState(2), [now, setNow] = useState(Date.now());
    const ex = session.exercises[index], c = ex.config, rec = recommend(c, state.sessions);
    const last = previous(state.sessions, c.exerciseId), unit = state.settings.unit;
    const rows = visibleSets(ex.sets), recorded = workingSets(ex.sets);
    const selected = rows.find(s => s.id === selectedId) ?? pendingSets(ex.sets)[0];
    const editing = selected?.status === 'completed';
    const rowNumber = selected ? rows.findIndex(s => s.id === selected.id) + 1 : 0;
    const progress = sessionProgress(session), currentProgress = exerciseProgress(ex);
    const seconds = session.restRemaining ?? Math.max(0, Math.ceil(((session.restUntil ?? 0) - now) / 1000));
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
    useEffect(() => {
        const saved = selected?.status === 'completed' ? selected : null;
        const position = ex.sets.filter(s => s.type === 'programmed').findIndex(s => s.id === selected?.id);
        setWeight(String(displayWeight(saved?.weight ?? recorded.at(-1)?.weight ?? rec.weight, unit)));
        setReps(String(saved?.reps ?? rec.reps[Math.max(0, position)] ?? c.min));
        setRir(saved?.rir ?? c.rirMin);
    }, [ex.id, selected?.id, selected?.status, unit]);
    const save = async () => {
        if (!selected) return;
        const wasPending = selected.status === 'pending';
        const ok = await send({ type: 'saveSet', sessionId: session.id, exerciseId: ex.id,
            set: { id: selected.id, weight: kg(Number(weight), unit), reps: Number(reps), rir, savedAt: new Date().toISOString() } });
        if (ok) {
            setSelectedId(null);
            if (wasPending && pendingSets(ex.sets).every(s => s.id === selected.id) && index < session.exercises.length - 1) setIndex(index + 1);
        }
    };
    const add = async () => {
        const id = uid();
        if (await send({ type: 'addSet', sessionId: session.id, exerciseId: ex.id, id, setType: 'additional' })) setSelectedId(id);
    };
    const remove = async (set: SetRecord, confirmed = false) => {
        if (set.status === 'completed' && !confirmed) { setRemovingId(set.id); return; }
        if (await send({ type: 'removeSet', sessionId: session.id, exerciseId: ex.id, setId: set.id, confirmed })) {
            if (selectedId === set.id) setSelectedId(null);
            setRemovingId(null);
        }
    };
    return <div className="workout-wrap">
        <div className="spread"><Button variant="ghost" onClick={close}><ChevronLeft/> Inicio</Button><span className="pill active">Sesión en curso</span></div>
        <div className="workout-title"><div><span className="eyebrow">{session.routineName}</span><h1>{session.dayName}</h1></div><span className="elapsed tabular">{Math.floor((now - new Date(session.startedAt).getTime()) / 60000)}<small> min</small></span></div>
        <div className="spread muted"><span>{progress.done} de {progress.target} series programadas{progress.additional > 0 && <span> · +{progress.additional} adicionales</span>}</span><span>Ejercicio {index + 1} / {session.exercises.length}</span></div>
        <Progress value={progress.percent} className="my-3" aria-label="Cumplimiento de series programadas"/>
        <div className="exercise-stepper">{session.exercises.map((e, i) => <button key={e.id} className={index === i ? 'selected' : ''} onClick={() => { setIndex(i); setSelectedId(null); }}>{exerciseProgress(e).complete ? <Check size={14}/> : i + 1}<span>{e.config.name}</span></button>)}</div>
        <article className="panel workout-panel">
            <span className="eyebrow">{c.group} · {c.targetSets} × {c.min}–{c.max} · RIR {c.rirMin}–{c.rirMax}</span><h2>{c.name}</h2>{c.notes && <p>{c.notes}</p>}
            <div className="previous"><span>Última sesión</span><strong>{last ? workingSets(last.sets).map(s => `${displayWeight(s.weight, unit)} × ${s.reps} @${s.rir}${s.type === 'additional' ? ' (adicional)' : ''}`).join(' · ') : 'Sin registros todavía'}</strong></div>
            <div className="recommendation"><div><span className="eyebrow">{rec.kind === 'increase' ? 'SUBIR CARGA' : rec.kind === 'reduce' ? 'AJUSTAR CARGA' : 'PRÓXIMA SERIE'}</span><p>{rec.reason}</p></div><strong>{rec.kind === 'start' ? '—' : displayWeight(rec.weight, unit)}<small> {unit}</small></strong></div>
            {c.type === 'bodyweight' && <p className="hint">Registra solo el lastre añadido. Sin lastre, introduce 0 {unit}. No se estima 1RM para este ejercicio.</p>}
            {rows.length > 0 && <Table><TableHeader><TableRow><TableHead>Serie</TableHead><TableHead>{unit}</TableHead><TableHead>Reps</TableHead><TableHead>RIR</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{rows.map((set, i) => <TableRow key={set.id} data-state={selected?.id === set.id ? 'selected' : undefined}>
                <TableCell>{set.status === 'completed' && <Check size={15} className="lime inline mr-1"/>}{i + 1}{set.type !== 'programmed' && <span className="block text-xs muted">{setTypeLabel(set.type)}</span>}</TableCell>
                <TableCell>{set.status === 'completed' ? displayWeight(set.weight, unit) : '—'}</TableCell><TableCell>{set.status === 'completed' ? set.reps : '—'}</TableCell><TableCell>{set.status === 'completed' ? set.rir : '—'}</TableCell>
                <TableCell><div className="inline-actions"><Button variant="ghost" aria-label={(set.status === 'completed' ? 'Editar' : 'Registrar') + ' serie ' + (i + 1)} onClick={() => setSelectedId(set.id)}>{set.status === 'completed' ? 'Editar' : 'Registrar'}</Button><Button variant="ghost" disabled={busy} aria-label={'Eliminar serie ' + (i + 1)} onClick={() => remove(set)}><Trash2 size={16}/></Button></div></TableCell>
            </TableRow>)}</TableBody></Table>}
            <Button variant="outline" className="mt-4" disabled={busy} onClick={add}><Plus/> Añadir serie</Button>
            <p className="hint">Las series añadidas o eliminadas solo afectan a esta sesión. Objetivo inicial: {c.targetSets} programadas.</p>
            {selected ? <div className="set-entry">
                <div className="spread"><h3>{editing ? 'Editar serie ' : 'Serie '}{rowNumber}{selected.type !== 'programmed' && <span className="pill ml-2">{setTypeLabel(selected.type)}</span>}</h3>{recorded.length > 0 && <Button variant="ghost" onClick={() => setWeight(String(displayWeight(recorded.at(-1)!.weight, unit)))}>Copiar peso anterior</Button>}</div>
                <div className="entry-grid">{[{ label: c.type === 'bodyweight' ? 'Lastre (' + unit + ')' : 'Peso (' + unit + ')', value: weight, set: setWeight, step: displayWeight(c.increment, unit), min: 0 }, { label: 'Repeticiones', value: reps, set: setReps, step: 1, min: 1 }].map(field => <label className="number-field" key={field.label}><span>{field.label}</span><div><Button variant="secondary" aria-label={'Reducir ' + field.label} onClick={() => field.set(String(Math.max(field.min, Math.round((Number(field.value) - field.step) * 100) / 100)))}><Minus/></Button><Input aria-label={field.label} type="number" min={field.min} step={field.label === 'Repeticiones' ? 1 : .01} inputMode="decimal" value={field.value} onChange={e => field.set(e.target.value)}/><Button variant="secondary" aria-label={'Aumentar ' + field.label} onClick={() => field.set(String(Math.round((Number(field.value) + field.step) * 100) / 100))}><Plus/></Button></div></label>)}</div>
                <label className="field"><span>RIR · repeticiones que te quedaban</span><div className="rir-picker">{[0, 1, 2, 3, 4, 5].map(n => <Button variant={rir === n ? 'default' : 'secondary'} key={n} onClick={() => setRir(n)} aria-label={'RIR ' + n} aria-pressed={rir === n}>{n}</Button>)}</div></label>
                <Button className="save-set" disabled={busy || weight === '' || reps === ''} onClick={save}><Check/>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar serie'}</Button>
                <div className="inline-actions mt-3">{editing && <Button variant="ghost" onClick={() => setSelectedId(null)}>Cancelar edición</Button>}<Button variant="ghost" disabled={busy} onClick={() => remove(selected)}><Trash2/> Eliminar serie</Button></div>
            </div> : <div className="exercise-complete"><Check/><h3>{currentProgress.complete ? 'Ejercicio completado' : 'Sin series pendientes'}</h3>{!currentProgress.complete && <p className="hint">{currentProgress.done} de {currentProgress.target} programadas realizadas.</p>}{index < session.exercises.length - 1 && <Button onClick={() => { setIndex(index + 1); setSelectedId(null); }}>Siguiente ejercicio <ChevronRight/></Button>}</div>}
        </article>
        {(seconds > 0 || session.restRemaining !== null) && <div className="rest-bar"><Timer/><div><small>DESCANSO</small><strong className="tabular">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong></div><Button variant="ghost" aria-label={session.restRemaining !== null ? 'Reanudar descanso' : 'Pausar descanso'} disabled={busy} onClick={() => send({ type: 'timer', id: session.id, restUntil: session.restRemaining !== null ? Date.now() + seconds * 1000 : null, restRemaining: session.restRemaining !== null ? null : seconds })}>{session.restRemaining !== null ? <Play/> : <Pause/>}</Button><Button variant="ghost" disabled={busy} onClick={() => send({ type: 'timer', id: session.id, restUntil: session.restRemaining === null ? Date.now() + (seconds + 30) * 1000 : null, restRemaining: session.restRemaining !== null ? seconds + 30 : null })}>+30 s</Button><Button variant="ghost" aria-label="Saltar descanso" disabled={busy} onClick={() => send({ type: 'timer', id: session.id, restUntil: null, restRemaining: null })}><SkipForward/></Button></div>}
        <div className="workout-footer"><Button variant="outline" disabled={busy} onClick={() => confirm('¿Reiniciar esta sesión?', 'La sesión anterior se conservará como cancelada. Empezarás con las series programadas originales.', async () => { await send({ type: 'restart', id: session.id }); })}><RotateCcw/> Reiniciar</Button><Button disabled={busy || progress.performed === 0} onClick={() => confirm('¿Finalizar entrenamiento?', `Llevas ${progress.done} de ${progress.target} series programadas y ${progress.additional} adicionales realizadas. Se guardarán las realizadas y avanzarás al siguiente día.`, async () => { if (await send({ type: 'finish', id: session.id })) close(); })}>Finalizar <Check/></Button></div>
        <Button className="cancel-session" variant="ghost" disabled={busy} onClick={() => confirm('¿Cancelar la sesión?', 'Las series guardadas se conservarán en el historial como sesión cancelada.', async () => { if (await send({ type: 'cancel', id: session.id })) close(); })}>Cancelar sesión</Button>
        <AlertDialog open={!!removingId} onOpenChange={open => { if (!open) setRemovingId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar esta serie?</AlertDialogTitle><AlertDialogDescription>Dejará de contar en esta sesión, el historial y los cálculos de progreso. La rutina original no cambia.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={event => { event.preventDefault(); const row = ex.sets.find(s => s.id === removingId); if (row) void remove(row, true); }}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>;
}
