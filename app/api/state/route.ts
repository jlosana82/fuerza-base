import { getChatGPTUser } from '@/app/chatgpt-auth';
import { load } from '@/lib/server/repository';
export async function GET() { const user = await getChatGPTUser(); if (!user)
    return Response.json({ error: 'Inicia sesión para acceder a tus datos.' }, { status: 401 }); try {
    return Response.json(await load(user.userId), { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    console.error('state load', e);
    return Response.json({ error: 'No se pudieron cargar tus datos. Vuelve a intentarlo.' }, { status: 503 });
} }
