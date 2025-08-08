import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId: string };
    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 500 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    await supabaseAdmin.from('temp_users').delete().eq('user_id', userId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro delete-temp-user:', err);
    return NextResponse.json({ error: 'Erro ao excluir usuário temporário' }, { status: 500 });
  }
}


