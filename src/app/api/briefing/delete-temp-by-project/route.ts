import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, email } = body as { projectId: string; email?: string };
    if (!projectId) {
      return NextResponse.json({ error: 'projectId obbligatorio' }, { status: 400 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' }, { status: 500 });
    }

    // 1) Tenta via temp_users
    try {
      const { data } = await supabaseAdmin
        .from('temp_users')
        .select('user_id')
        .eq('project_id', projectId);
      if (data && data.length > 0) {
        for (const row of data) {
          if (row.user_id) {
            await supabaseAdmin.auth.admin.deleteUser(row.user_id).catch(() => undefined);
          }
        }
        await supabaseAdmin.from('temp_users').delete().eq('project_id', projectId).catch(() => undefined);
        return NextResponse.json({ ok: true, deletedBy: 'temp_users' }, { status: 200 });
      }
    } catch (_) {
      // ignora errore se tabella non esiste
    }

    // 2) Fallback: se email fornita, prova a cercare via Admin API (lista utenti)
    if (email) {
      try {
        // Nota: listUsers è paginado; qui controlliamo prime 1000 entries per semplicità
        const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (found?.id) {
          await supabaseAdmin.auth.admin.deleteUser(found.id).catch(() => undefined);
          return NextResponse.json({ ok: true, deletedBy: 'email' }, { status: 200 });
        }
      } catch (_) {
        // ignora errori
      }
    }

    return NextResponse.json({ ok: true, info: 'nessun utente temporaneo trovato' }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Errore delete-temp-by-project:', err);
    return NextResponse.json({ error: 'Errore nel cancellare utente temporaneo' }, { status: 500 });
  }
}


