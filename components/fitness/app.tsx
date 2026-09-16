'use client';
import { useEffect, useRef, useState } from 'react';
import { Home, Dumbbell, History as HistoryIcon, ChartNoAxesCombined, Settings as SettingsIcon, ArrowUpRight, Play, Plus, CalendarDays, Check, Timer, Activity, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Toaster, toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import type { AppState, Settings } from '@/lib/domain/model';
import type { Action } from '@/lib/domain/actions';
import { newRecordNames, records, volume } from '@/lib/domain/progression';
import Routines from './routines';
import Workout from './workout';
import PhysicalProgress, { History } from './progress';
import { Choice, Field, Nothing, Trend, dateLabel, displayWeight, kg } from './shared';
const navigation = [{ id: 'home', label: 'Inicio', icon: Home }, { id: 'routines', label: 'Rutinas', icon: Dumbbell }, { id: 'history', label: 'Historial', icon: HistoryIcon }, { id: 'progress', label: 'Progreso', icon: ChartNoAxesCombined }, { id: 'settings', label: 'Ajustes', icon: SettingsIcon }];
export default function FitnessApp() {
    const [state, setState] = useState<AppState | null>(null), [page, setPage] = useState('home'), [busy, setBusy] = useState(false), [error, setError] = useState(''), [training, setTraining] = useState(false), [confirmation, setConfirmation] = useState<{
        title: string;
        description: string;
        run: () => void;
    } | null>(null);
    const lock = useRef(false), stateRef = useRef(state);
    stateRef.current = state;
    const load = async () => { setError(''); try {
        const r = await fetch('/api/state', { cache: 'no-store' });
        const data = await r.json() as AppState & {
            error?: string;
        };
        if (!r.ok)
            throw Error(data.error);
        setState(data);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.');
    } };
    useEffect(() => { void load(); }, []);
    useEffect(() => { document.documentElement.dataset.theme = state?.settings.theme ?? 'dark'; }, [state?.settings.theme]);
    const send = async (action: Action) => { if (lock.current || !stateRef.current)
        return false; lock.current = true; setBusy(true); const before = stateRef.current; try {
        const r = await fetch('/api/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: before.version, action }) });
        const after = await r.json() as AppState & {
            error?: string;
        };
        if (!r.ok) {
            if (r.status === 409)
                await load();
            throw Error(after.error);
        }
        setState(after);
        if (action.type === 'finish') {
            const names = newRecordNames(before, after);
            toast.success(names.length ? 'Nuevo récord · ' + names.join(', ') : 'Entrenamiento guardado');
        }
        else if (!['timer', 'start'].includes(action.type))
            toast.success(action.type === 'saveSet' ? 'Serie guardada' : 'Cambios guardados');
        return true;
    }
    catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo guardar.');
        return false;
    }
    finally {
        lock.current = false;
        setBusy(false);
    } };
    const confirm = (title: string, description: string, run: () => void) => setConfirmation({ title, description, run });
    useEffect(() => { const mc = (document as any).modelContext; if (!mc?.registerTool)
        return; const lifecycle = new AbortController(); const tool = { name: 'get_training_summary', description: 'Read the signed-in user’s active routine, next day and completed session count. Read-only.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: async (input: unknown) => { if (!input || typeof input !== 'object' || Object.keys(input).length)
            throw Error('Expected empty object'); const s = stateRef.current, r = s?.routines.find(x => x.status === 'active'); return { content: [{ type: 'text', text: JSON.stringify({ routine: r?.name, nextDay: r?.days[r.nextDay]?.name, completed: s?.sessions.filter(x => x.status === 'complete').length }) }] }; } }; try {
        void Promise.resolve(mc.registerTool(tool, { signal: lifecycle.signal })).catch(console.error);
    }
    catch (e) {
        console.error(e);
    } return () => lifecycle.abort(); }, []);
    const active = state?.sessions.find(s => s.status === 'active');
    const go = (id: string) => { setPage(id); setTraining(false); };
    return <SidebarProvider><Sidebar className="app-sidebar"><SidebarHeader><div className="brand"><span><Dumbbell size={25}/></span><div>FUERZA<span>BASE</span></div></div></SidebarHeader><SidebarContent><span className="nav-caption">TU ENTRENAMIENTO</span><SidebarMenu>{navigation.map(n => <SidebarMenuItem key={n.id}><SidebarMenuButton isActive={page === n.id && !training} onClick={() => go(n.id)}><n.icon /><span>{n.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter><div className="sidebar-note"><div className="monogram">FB</div><div><strong>Tu espacio personal</strong><small>Un entrenamiento a la vez.</small></div></div></SidebarFooter></Sidebar><SidebarInset className="main-shell"><header className="topbar"><span>FUERZA BASE <span className="muted"> / {training ? 'Entrenamiento' : navigation.find(n => n.id === page)?.label}</span></span><span className="topbar-date">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span className="avatar">FB</span></header><main className="main-content">{!state ? <>{error ? <div className="panel"><h1>No se pudo abrir tu espacio</h1><p role="alert">{error}</p><Button onClick={load}>Volver a intentar</Button><a href="/signin-with-chatgpt?return_to=%2F" target="_top" className="signin-link">Iniciar sesión con ChatGPT</a></div> : <><h1>Tu entrenamiento</h1><Skeleton className="h-64 w-full"/><p className="muted">Cargando tus rutinas…</p></>}</> : training && active ? <Workout key={active.id} state={state} session={active} send={send} busy={busy} close={() => setTraining(false)} confirm={confirm}/> : <><div className="page-heading"><div><span className="eyebrow">{page === 'home' ? 'CONSTANCIA, SERIE A SERIE' : 'FUERZA BASE'}</span><h1>{page === 'home' ? 'Tu entrenamiento.' : page === 'routines' ? 'Diseña tu siguiente etapa.' : page === 'history' ? 'Cada sesión cuenta.' : page === 'progress' ? 'Mira cuánto has avanzado.' : 'A tu manera.'}</h1><p>{page === 'home' ? 'Todo preparado para seguir construyendo.' : page === 'routines' ? 'Un plan claro. Espacio para evolucionar.' : page === 'history' ? 'Tus entrenamientos, tal y como los hiciste.' : page === 'progress' ? 'Datos reales para entender tu progreso.' : 'Ajusta los detalles de tu entrenamiento.'}</p></div>{page === 'home' && <Button variant="outline" onClick={() => go('routines')}>Ver rutinas <ArrowUpRight /></Button>}</div>{page === 'home' && <Dashboard state={state} go={go} start={async () => { if (active) {
        setTraining(true);
        return;
    } if (await send({ type: 'start' }))
        setTraining(true); }} busy={busy} confirm={confirm} send={send}/>}{page === 'routines' && <Routines state={state} send={send} busy={busy} confirm={confirm}/>}{page === 'history' && <History state={state}/>}{page === 'progress' && <PhysicalProgress state={state} send={send} busy={busy}/>}{page === 'settings' && <Preferences key={state.version} settings={state.settings} busy={busy} send={send}/>}</>}</main><nav className="bottom-nav" aria-label="Navegación principal">{navigation.map(n => <button key={n.id} className={page === n.id && !training ? 'selected' : ''} onClick={() => go(n.id)}><n.icon size={21}/><span>{n.label}</span></button>)}</nav></SidebarInset><Toaster position="top-center" theme={state?.settings.theme ?? 'dark'} richColors/><AlertDialog open={!!confirmation} onOpenChange={o => { if (!o)
        setConfirmation(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmation?.title}</AlertDialogTitle><AlertDialogDescription>{confirmation?.description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Volver</AlertDialogCancel><AlertDialogAction onClick={() => { confirmation?.run(); setConfirmation(null); }}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></SidebarProvider>;
}
function Dashboard({ state, go, start, busy, confirm, send }: {
    state: AppState;
    go: (p: string) => void;
    start: () => void;
    busy: boolean;
    confirm: (a: string, b: string, c: () => void) => void;
    send: (a: Action) => Promise<boolean>;
}) {
    const routine = state.routines.find(r => r.status === 'active'), day = routine?.days[routine.nextDay % routine.days.length], active = state.sessions.find(s => s.status === 'active'), completed = state.sessions.filter(s => s.status === 'complete'), last = completed.at(-1), latest = state.measurements.filter(m => m.weight).at(-1), weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + (state.settings.weekStart === 'monday' ? 6 : 0)) % 7));
    const thisWeek = completed.filter(s => new Date(s.startedAt) >= weekStart), days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), prs = records(completed).filter(r => r.weight > 0).slice(0, 3), unit = state.settings.unit;
    return <>{active && <div className="resume-banner"><div><strong>Hay un entrenamiento sin terminar.</strong><p>{active.dayName} · Tus series guardadas están a salvo.</p></div><div className="inline-actions"><Button onClick={start}>Continuar</Button><Button variant="outline" onClick={() => confirm('¿Reiniciar sesión?', 'Conservaremos la anterior como cancelada.', async () => { if (await send({ type: 'restart', id: active.id }))
        start(); })}>Reiniciar</Button><Button variant="ghost" onClick={() => confirm('¿Cancelar sesión?', 'Se conservarán las series como sesión cancelada.', () => { void send({ type: 'cancel', id: active.id }); })}>Cancelar sesión</Button></div></div>}
    <div className="dashboard-top"><article className="next-session"><div className="spread"><span className="eyebrow">{active ? 'SESIÓN EN CURSO' : 'PRÓXIMO ENTRENAMIENTO'}</span><span className="pill">{routine ? 'Rutina activa' : 'Sin rutina activa'}</span></div><h2>{active?.dayName ?? day?.name ?? 'Tu próximo comienzo'}</h2><p className="routine-name">{active?.routineName ?? routine?.name ?? 'Crea o activa una rutina para entrenar.'}</p><div className="session-meta"><span><Dumbbell size={17}/>{day?.exercises.length ?? 0} ejercicios</span><span><Timer size={17}/>{day?.exercises.reduce((n, e) => n + e.sets, 0) ?? 0} series</span><span><Activity size={17}/> Doble progresión</span></div><div className="next-bottom"><Button className="train-button" onClick={routine || active ? start : () => go('routines')} disabled={busy}><Play size={18} fill="currentColor"/>{active ? 'Continuar sesión' : routine ? 'Entrenar' : 'Elegir rutina'}<ChevronRight /></Button><span>Con tu ritmo.<br />Con un plan.</span></div><span className="day-watermark" aria-hidden="true">{(active?.dayName ?? day?.name ?? 'A').replace('Día ', '')}</span></article><article className="panel weekly"><div className="spread"><h3>Esta semana</h3><CalendarDays size={19} className="muted"/></div><div className="weekly-number"><strong>{thisWeek.length}</strong><span>/ {state.settings.weeklyGoal} sesiones</span></div><div className="week-days">{days.map(d => { const checked = thisWeek.some(s => new Date(s.startedAt).toDateString() === d.toDateString()); return <div key={d.toISOString()}><span>{d.toLocaleDateString('es-ES', { weekday: 'narrow' })}</span><span className={(checked ? 'done ' : '') + (d.toDateString() === new Date().toDateString() ? 'today' : '')}>{checked ? <Check size={17}/> : d.getDate()}</span></div>; })}</div><Progress value={Math.min(100, thisWeek.length / state.settings.weeklyGoal * 100)}/><p>{thisWeek.length >= state.settings.weeklyGoal ? 'Objetivo semanal completado.' : `${Math.max(0, state.settings.weeklyGoal - thisWeek.length)} sesiones para tu objetivo semanal.`}</p></article></div>
    <div className="stats-grid"><div className="panel stat"><span>Entrenamientos</span><strong>{completed.length}<small> en total</small></strong><p>Tu constancia, registrada</p></div><div className="panel stat"><span>Peso corporal</span><strong>{latest ? displayWeight(latest.weight!, unit) : '—'}<small> {unit}</small></strong><button className="text-link" onClick={() => go('progress')}>{latest ? 'Ver evolución' : 'Añadir primer registro'} <ArrowUpRight size={14}/></button></div><div className="panel stat"><span>Volumen esta semana</span><strong>{displayWeight(thisWeek.reduce((n, s) => n + s.exercises.reduce((v, e) => v + volume(e.sets), 0), 0), unit).toLocaleString('es-ES', { maximumFractionDigits: 0 })}<small> {unit}</small></strong><p>Carga externa × repeticiones</p></div><div className="panel stat"><span>Última sesión</span><strong className="stat-text">{last?.dayName ?? 'Por empezar'}</strong><p>{last ? dateLabel(last.startedAt, state.settings) : 'Tu primera sesión te espera'}</p></div></div>
    <div className="dashboard-bottom"><article className="panel"><div className="section-heading"><div><span className="eyebrow">PROGRESO FÍSICO</span><h3>Evolución del peso</h3></div><button className="text-link" onClick={() => go('progress')}>Ver todo <ArrowUpRight size={16}/></button></div><Trend data={state.measurements.filter(m => m.weight).map(m => ({ date: dateLabel(m.date, state.settings), value: displayWeight(m.weight!, unit) }))} unit={unit}/></article><article className="panel"><div className="section-heading"><div><span className="eyebrow">TU REFERENCIA</span><h3>Récords personales</h3></div><ChartNoAxesCombined size={21} className="muted"/></div>{prs.length ? prs.map(pr => <div className="pr-row" key={pr.exerciseId}><div><strong>{state.exercises.find(e => e.id === pr.exerciseId)?.name}</strong><p>Mayor carga registrada</p></div><strong>{displayWeight(pr.weight, unit)} <small>{unit}</small></strong></div>) : <Nothing title="El primer récord está por llegar" description="Completa una sesión para establecer tus marcas de referencia."/>}<button className="text-link" onClick={() => go('progress')}>Explorar tu fuerza <ArrowUpRight size={16}/></button></article></div>
    {day && <div className="panel upcoming"><div className="section-heading"><h3>Tu sesión, de un vistazo</h3><span className="muted">{day.name}</span></div><div className="upcoming-grid">{day.exercises.map((e, i) => <div key={e.id}><span className="exercise-index">{String(i + 1).padStart(2, '0')}</span><strong>{e.name}</strong><p>{e.sets} × {e.min}–{e.max} · RIR {e.rirMin}–{e.rirMax}</p></div>)}</div></div>}</>;
}
function Preferences({ settings, send, busy }: {
    settings: Settings;
    send: (a: Action) => Promise<boolean>;
    busy: boolean;
}) { const [draft, setDraft] = useState(settings); return <div className="panel preferences"><h2>Preferencias de entrenamiento</h2><div className="form-grid"><label className="field"><span>Unidad de peso</span><Choice label="Unidad" value={draft.unit} onChange={v => setDraft({ ...draft, unit: v as Settings['unit'] })} options={[{ value: 'kg', label: 'Kilogramos (kg)' }, { value: 'lb', label: 'Libras (lb)' }]}/></label><Field label={'Incremento por defecto (' + draft.unit + ')'} type="number" step={.01} value={displayWeight(draft.increment, draft.unit)} onChange={v => setDraft({ ...draft, increment: kg(Number(v), draft.unit) })}/><Field label="Objetivo de sesiones por semana" type="number" min={1} max={7} value={draft.weeklyGoal} onChange={v => setDraft({ ...draft, weeklyGoal: Number(v) })}/><label className="field"><span>Inicio de semana</span><Choice label="Inicio de semana" value={draft.weekStart} onChange={v => setDraft({ ...draft, weekStart: v as Settings['weekStart'] })} options={[{ value: 'monday', label: 'Lunes' }, { value: 'sunday', label: 'Domingo' }]}/></label><label className="field"><span>Tema</span><Choice label="Tema" value={draft.theme} onChange={v => setDraft({ ...draft, theme: v as Settings['theme'] })} options={[{ value: 'dark', label: 'Oscuro' }, { value: 'light', label: 'Claro' }]}/></label><label className="field"><span>Formato de fecha</span><Choice label="Formato de fecha" value={draft.dateFormat} onChange={v => setDraft({ ...draft, dateFormat: v as Settings['dateFormat'] })} options={[{ value: 'es', label: '16 sept 2026' }, { value: 'iso', label: '2026-09-16' }]}/></label></div><label className="toggle-row"><div><strong>Descanso automático</strong><p>Inicia el temporizador al guardar una serie.</p></div><Switch checked={draft.timer} onCheckedChange={v => setDraft({ ...draft, timer: v })}/></label><label className="toggle-row"><div><strong>Mostrar RIR en el historial</strong><p>El RIR se registra siempre en cada serie.</p></div><Switch checked={draft.showRir} onCheckedChange={v => setDraft({ ...draft, showRir: v })}/></label><Button disabled={busy} onClick={() => send({ type: 'settings', settings: draft })}>Guardar ajustes</Button><p className="hint">Tus rutinas y entrenamientos se guardan en tu cuenta. Para confirmar una serie necesitas conexión; espera a ver «Serie guardada» antes de cerrar.</p><a className="text-link" href="/signout-with-chatgpt?return_to=%2F" target="_top">Cerrar sesión</a></div>; }
