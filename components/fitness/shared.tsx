'use client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Settings } from '@/lib/domain/model';
export function Choice({ value, onChange, options, label }: {
    value: string;
    onChange: (v: string) => void;
    options: {
        value: string;
        label: string;
    }[];
    label: string;
}) { return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full min-h-11"><SelectValue /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>; }
export function Field({ label, value, onChange, type = 'text', step, min, max }: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    step?: number;
    min?: number;
    max?: number;
}) { return <label className="field"><span>{label}</span><Input value={value} onChange={e => onChange(e.target.value)} type={type} step={step} min={min} max={max} inputMode={type === 'number' ? 'decimal' : undefined}/></label>; }
export function Nothing({ title, description }: {
    title: string;
    description: string;
}) { return <Empty className="empty-state"><EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader></Empty>; }
export const displayWeight = (v: number, unit: string) => Math.round(v * (unit === 'lb' ? 2.2046226218 : 1) * 100) / 100;
export const kg = (v: number, unit: string) => v / (unit === 'lb' ? 2.2046226218 : 1);
export const dateLabel = (date: string, settings: Settings) => settings.dateFormat === 'iso' ? date.slice(0, 10) : new Date(date.length === 10 ? date + 'T12:00:00' : date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
export function Trend({ data, unit }: {
    data: {
        date: string;
        value: number;
    }[];
    unit: string;
}) { if (data.length < 2)
    return <Nothing title={data.length ? 'Un primer punto de partida' : 'Tu evolución empieza aquí'} description={data.length ? 'Añade otro registro para ver la tendencia.' : 'Los gráficos aparecerán con tus registros reales.'}/>; return <div className="chart" role="img" aria-label={'Evolución en ' + unit}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: 0, right: 14, top: 16, bottom: 4 }}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={.25}/><stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 5"/><XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickLine={false} axisLine={false}/><YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickLine={false} axisLine={false} width={44}/><Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12 }} formatter={(v) => [Number(v).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' ' + unit, 'Registro']}/><Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#trendFill)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div>; }
