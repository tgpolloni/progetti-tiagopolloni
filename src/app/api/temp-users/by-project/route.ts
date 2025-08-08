import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId è obbligatorio' }, { status: 400 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('temp_users')
      .select('email,password,expires_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Se a tabela/colunas não existirem, retorna vazio (não é erro fatal para o app)
      // eslint-disable-next-line no-console
      console.warn('temp_users query warning:', error);
      return NextResponse.json({}, { status: 200 });
    }
    if (!data) return NextResponse.json({}, { status: 200 });

    return NextResponse.json({ email: data.email, password: data.password, expiresAt: data.expires_at }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Errore GET /api/temp-users/by-project:', err);
    return NextResponse.json({ error: 'Errore nel recupero credenziali temporanee' }, { status: 500 });
  }
}


