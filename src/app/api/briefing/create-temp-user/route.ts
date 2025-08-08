import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, email, password } = body as { projectId: string; email: string; password: string };
    if (!projectId || !email || !password) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 500 });
    }

    // Cria usuário de auth
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { temp_briefing: true, projectId },
      user_metadata: { temp_briefing: true, projectId }
    });
    if (error) throw error;

    // Registrar em tabela auxiliar (opcional): temp_users
    // Tenta salvar registro em temp_users (se a tabela existir)
    const insertRes = await supabaseAdmin.from('temp_users').insert({
      user_id: created.user?.id,
      project_id: projectId,
      email,
      password,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24h
    });
    if (insertRes.error) {
      // eslint-disable-next-line no-console
      console.warn('temp_users insert error:', insertRes.error);
      // não bloqueia a criação do usuário; retorna flag para o cliente poder avisar
      return NextResponse.json({ userId: created.user?.id, tempSaved: false }, { status: 200 });
    }

    return NextResponse.json({ userId: created.user?.id, tempSaved: true }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('Erro create-temp-user:', err);
    return NextResponse.json({ error: 'Erro ao criar usuário temporário' }, { status: 500 });
  }
}


