'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import { copyToClipboard } from '@/lib/utils';
import { Copy, CheckCircle2, AlertCircle, Network, ShieldCheck } from 'lucide-react';

export default function ImpostazioniPage() {
  const { user } = useAuth();

  // Alterar senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error' | '';
    text: string;
  }>({ type: '', text: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A senha deve ter ao menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    try {
      setChangingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordMessage({ type: 'error', text: 'Falha ao alterar senha. Tente novamente.' });
      // eslint-disable-next-line no-console
      console.error('Erro ao alterar senha:', err);
    } finally {
      setChangingPassword(false);
    }
  };

  // Copiar valores
  const [copiedKey, setCopiedKey] = useState<string>('');
  const handleCopy = async (label: string, value?: string) => {
    if (!value) return;
    try {
      const ok = await copyToClipboard(value);
      if (!ok) throw new Error('copy failed');
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(''), 1500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao copiar para a área de transferência:', err);
    }
  };

  // Verificações Supabase
  const [checkingSession, setCheckingSession] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string>('');
  const [checkingDb, setCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('');

  const handleCheckSession = async () => {
    try {
      setCheckingSession(true);
      setSessionStatus('');
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSessionStatus('Sessão válida e ativa.');
      } else {
        setSessionStatus('Nenhuma sessão ativa encontrada.');
      }
    } catch (err) {
      setSessionStatus('Erro ao verificar sessão.');
      // eslint-disable-next-line no-console
      console.error('Erro sessão:', err);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleCheckDb = async () => {
    try {
      setCheckingDb(true);
      setDbStatus('');
      const { error } = await supabase.from('projects').select('id').limit(1);
      if (error) throw error;
      setDbStatus('Conexão com banco OK. Consulta executada com sucesso.');
    } catch (err) {
      setDbStatus('Falha ao consultar banco (verifique políticas RLS, tabelas e login).');
      // eslint-disable-next-line no-console
      console.error('Erro DB:', err);
    } finally {
      setCheckingDb(false);
    }
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
              <p className="text-gray-600">Impostazioni di account, applicazione e connessione</p>
            </div>
          </div>

          {/* Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Dati utente autenticato e cambio password</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600">Utente autenticato</p>
                  <p className="text-gray-900 font-medium">{user?.email || '—'}</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                  <p className="text-sm font-medium text-gray-900">Cambia password</p>
                  <Input
                    type="password"
                    placeholder="Nuova password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Conferma nuova password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {passwordMessage.text && (
                    <div
                      className={
                        passwordMessage.type === 'success'
                          ? 'text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm'
                          : 'text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm'
                      }
                    >
                      {passwordMessage.type === 'success' ? (
                        <span className="inline-flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" />{passwordMessage.text}</span>
                      ) : (
                        <span className="inline-flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{passwordMessage.text}</span>
                      )}
                    </div>
                  )}
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? 'Salvataggio...' : 'Salva password'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Aplicativo */}
          <Card>
            <CardHeader>
              <CardTitle>Applicazione</CardTitle>
              <CardDescription>Variabili pubbliche e utilità</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <EnvRow label="NEXT_PUBLIC_APP_URL" value={appUrl} onCopy={handleCopy} copiedKey={copiedKey} />
                <EnvRow label="NEXT_PUBLIC_ADMIN_EMAIL" value={adminEmail} onCopy={handleCopy} copiedKey={copiedKey} />
              </div>
            </CardContent>
          </Card>

          {/* Conexão Supabase */}
          <Card>
            <CardHeader>
              <CardTitle>Supabase</CardTitle>
              <CardDescription>Verifiche rapide di sessione e database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-900 mb-2">Sessione</p>
                  <Button variant="outline" onClick={handleCheckSession} disabled={checkingSession} className="mb-2">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {checkingSession ? 'Verifica in corso...' : 'Verifica sessione'}
                  </Button>
                  {sessionStatus && (
                    <p className="text-sm text-gray-700">{sessionStatus}</p>
                  )}
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-gray-900 mb-2">Database</p>
                  <Button variant="outline" onClick={handleCheckDb} disabled={checkingDb} className="mb-2">
                    <Network className="w-4 h-4 mr-2" />
                    {checkingDb ? 'Test in corso...' : 'Testa query'}
                  </Button>
                  {dbStatus && (
                    <p className="text-sm text-gray-700">{dbStatus}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function EnvRow({
  label,
  value,
  onCopy,
  copiedKey,
}: {
  label: string;
  value?: string;
  onCopy: (label: string, value?: string) => void;
  copiedKey: string;
}) {
  return (
    <div className="p-4 border rounded-md">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center">
        <code className="text-sm text-gray-800 break-all flex-1">{value || '—'}</code>
        <Button variant="ghost" size="sm" onClick={() => onCopy(label, value)} title="Copia">
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      {copiedKey === label && (
        <p className="text-xs text-green-700 mt-1">Copiato!</p>
      )}
    </div>
  );
}


