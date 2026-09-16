import { getChatGPTUser } from '@/app/chatgpt-auth';
import { load, save, Conflict } from '@/lib/server/repository';
import { reduce, actionSchema } from '@/lib/domain/actions';
export async function POST(request: Request) { const origin = request.headers.get('origin'); if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: 'Origen no permitido.' }, { status: 403 }); const user = await getChatGPTUser(); if (!user)
    return Response.json({ error: 'Inicia sesión para guardar.' }, { status: 401 }); try {
    const body = await request.json() as {
        action: unknown;
        version: number;
    };
    const parsed = actionSchema.safeParse(body.action);
    if (!parsed.success)
        return Response.json({ error: 'Revisa los campos: ' + parsed.error.issues[0].message }, { status: 400 });
    const before = await load(user.userId);
    if (body.version !== before.version)
        throw new Conflict('Hay cambios desde otro dispositivo. Recarga antes de guardar.');
    const after = reduce(before, parsed.data);
    await save(user.userId, before, after);
    return Response.json(after, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    if (e instanceof Conflict)
        return Response.json({ error: e.message }, { status: 409 });
    console.error('action save', e);
    return Response.json({ error: e instanceof Error && !/SQL|Database|D1|binding/i.test(e.message) ? e.message : 'No se pudo guardar. Tus datos introducidos siguen en pantalla.' }, { status: 400 });
} }
