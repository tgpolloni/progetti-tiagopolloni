'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { Client, Project } from '@/types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Save, UserPlus, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { copyToClipboard } from '@/lib/utils';

const schema = yup.object({
  nome: yup.string().required('Nome del progetto richiesto'),
  descrizione: yup.string(),
  clientId: yup.string().required('Cliente richiesto'),
  status: yup.string().oneOf(['In attesa di briefing', 'In corso', 'Pausa', 'Completato']).required('Status richiesto'),
  internalNotes: yup.string(),
  dataInizio: yup.string().nullable(),
  dataFinePrevista: yup.string().nullable(),
  budget: yup
    .number()
    .typeError('Budget deve essere numerico')
    .nullable()
});

type ProjectFormData = {
  nome: string;
  descrizione?: string;
  clientId: string;
  status: Project['status'];
  internalNotes?: string;
  dataInizio?: string | null;
  dataFinePrevista?: string | null;
  budget?: number | null;
};

export default function NuovoProgettoPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [tempError, setTempError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProjectFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      status: 'In attesa di briefing'
    }
  });

  const {
    register: registerClient,
    handleSubmit: handleSubmitClient,
    formState: { errors: clientErrors },
    reset: resetClient
  } = useForm<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>({
    resolver: yupResolver(yup.object({
      nomeCompleto: yup.string().required('Nome completo richiesto'),
      nomeAzienda: yup.string(),
      codiceFiscaleOrPIVA: yup.string().required('Codice fiscale o P.IVA richiesto'),
      email: yup.string().email('Email non valida').required('Email richiesta'),
      telefono: yup.string().required('Telefono richiesto'),
      ruolo: yup.string().required('Ruolo richiesto')
    }))
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await clientService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Errore nel caricamento dei clienti:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setSaving(true);
      
      const projectData = {
        ...data,
        briefingCompleted: false,
        files: []
      };
      
      const projectId = await projectService.createProject(projectData);

      // Gera usuário temporário para o briefing
      const client = clients.find(c => c.id === data.clientId);
      const email = client?.email;
      if (email) {
        const password = generateSafePassword();
        setTempEmail(email);
        setTempPassword(password);
        setCreatedProjectId(projectId);
        const link = `${window.location.origin}/briefing/${projectId}`;
        setProjectLink(link);
        try {
          setTempError('');
          const res = await fetch('/api/briefing/create-temp-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, email, password })
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error || 'Errore nella creazione dell’utente temporaneo');
          }
        } catch (err: unknown) {
          setTempError('Non è stato possibile creare l’utente temporaneo. Verifica SUPABASE_SERVICE_ROLE_KEY e la tabella temp_users.');
        }
        // Mostra modal com credenciais e link
        setShowCredModal(true);
      } else {
        // Se não encontrar email, apenas navega
        router.push(`/dashboard/progetti/${projectId}`);
      }
    } catch (error) {
      console.error('Errore nella creazione del progetto:', error);
      alert('Errore nella creazione del progetto');
    } finally {
      setSaving(false);
    }
  };

  function generateSafePassword(): string {
    // Quatro dígitos numéricos, simples de digitar
    const n = Math.floor(1000 + Math.random() * 9000); // 1000..9999
    return String(n);
  }

  const onSubmitClient = async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const clientId = await clientService.createClient(data);
      await loadClients();
      setValue('clientId', clientId);
      setShowNewClientForm(false);
      resetClient();
    } catch (error) {
      console.error('Errore nella creazione del cliente:', error);
      alert('Errore nella creazione del cliente');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/progetti">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nuovo Progetto</h1>
              <p className="text-gray-600">Crea un nuovo progetto per un cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form principale */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dettagli del Progetto</CardTitle>
                  <CardDescription>
                    Inserisci le informazioni base del progetto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                      label="Nome del Progetto"
                      placeholder="es. Sito web aziendale"
                      error={errors.nome?.message}
                      {...register('nome')}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrizione (opzionale)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Breve descrizione del progetto..."
                        {...register('descrizione')}
                      />
                      {errors.descrizione && (
                        <p className="mt-1 text-sm text-red-600">{errors.descrizione.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente *
                      </label>
                      <div className="flex space-x-2">
                        <select
                          className="flex-1 h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          {...register('clientId')}
                        >
                          <option value="">Seleziona un cliente</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.nomeCompleto} {client.nomeAzienda && `(${client.nomeAzienda})`}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewClientForm(!showNewClientForm)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.clientId && (
                        <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
                      )}
                    </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        {...register('status')}
                      >
                        <option value="In attesa di briefing">In attesa di briefing</option>
                        <option value="In corso">In corso</option>
                        <option value="Pausa">Pausa</option>
                        <option value="Completato">Completato</option>
                      </select>
                      {errors.status && (
                        <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                      )}
                    </div>

                    {/* Date e Budget */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data inizio</label>
                        <input
                          type="date"
                          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          {...register('dataInizio')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data fine prevista</label>
                        <input
                          type="date"
                          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          {...register('dataFinePrevista')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          {...register('budget')}
                        />
                        {errors.budget && (
                          <p className="mt-1 text-sm text-red-600">{String(errors.budget.message)}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note Interne (opzionale)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Note private per il progetto..."
                        {...register('internalNotes')}
                      />
                      {errors.internalNotes && (
                        <p className="mt-1 text-sm text-red-600">{errors.internalNotes.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Link href="/dashboard/progetti">
                        <Button variant="outline" type="button">
                          Annulla
                        </Button>
                      </Link>
                      <Button type="submit" disabled={saving} className="bg-primary-gradient">
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creazione...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Crea Progetto
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Form nuovo cliente */}
            <div>
              {showNewClientForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nuovo Cliente</CardTitle>
                    <CardDescription>
                      Aggiungi un nuovo cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitClient(onSubmitClient)} className="space-y-4">
                      <Input
                        label="Nome Completo"
                        placeholder="Mario Rossi"
                        error={clientErrors.nomeCompleto?.message}
                        {...registerClient('nomeCompleto')}
                      />

                      <Input
                        label="Nome Azienda"
                        placeholder="Azienda S.r.l. (opzionale)"
                        error={clientErrors.nomeAzienda?.message}
                        {...registerClient('nomeAzienda')}
                      />

                      <Input
                        label="Codice Fiscale o P.IVA"
                        placeholder="RSSMRA80A01H501Z"
                        error={clientErrors.codiceFiscaleOrPIVA?.message}
                        {...registerClient('codiceFiscaleOrPIVA')}
                      />

                      <Input
                        label="Email"
                        type="email"
                        placeholder="mario@example.com"
                        error={clientErrors.email?.message}
                        {...registerClient('email')}
                      />

                      <Input
                        label="Telefono"
                        placeholder="+39 123 456 7890"
                        error={clientErrors.telefono?.message}
                        {...registerClient('telefono')}
                      />

                      <Input
                        label="Ruolo"
                        placeholder="CEO, Manager, etc."
                        error={clientErrors.ruolo?.message}
                        {...registerClient('ruolo')}
                      />

                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewClientForm(false)}
                          className="flex-1"
                        >
                          Annulla
                        </Button>
                        <Button type="submit" size="sm" className="flex-1 bg-primary-gradient">
                          Aggiungi
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Modal credenziali temporanee */}
              {showCredModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                    <h3 className="text-lg font-medium mb-1">Credenziali per il cliente</h3>
                    <p className="text-sm text-gray-600 mb-4">Invia queste informazioni al cliente per accedere e compilare il briefing.</p>
                    {tempError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{tempError}</div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Link</p>
                        <div className="flex items-center">
                          <code className="text-sm text-gray-800 break-all flex-1">{projectLink}</code>
                          <button
                            type="button"
                            className="ml-2 inline-flex items-center px-2 py-1 border rounded text-sm"
                            onClick={async () => { await copyToClipboard(projectLink); }}
                          >
                            <Copy className="w-4 h-4 mr-1" /> Copia
                          </button>
                          <a href={projectLink} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center px-2 py-1 border rounded text-sm">
                            <ExternalLink className="w-4 h-4 mr-1" /> Apri
                          </a>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <div className="flex items-center">
                            <code className="text-sm text-gray-800 break-all flex-1">{tempEmail}</code>
                            <button
                              type="button"
                              className="ml-2 inline-flex items-center px-2 py-1 border rounded text-sm"
                              onClick={async () => { await copyToClipboard(tempEmail); }}
                            >
                              <Copy className="w-4 h-4 mr-1" /> Copia
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Password</p>
                          <div className="flex items-center">
                            <code className="text-sm text-gray-800 break-all flex-1">{tempPassword}</code>
                            <button
                              type="button"
                              className="ml-2 inline-flex items-center px-2 py-1 border rounded text-sm"
                              onClick={async () => { await copyToClipboard(tempPassword); }}
                            >
                              <Copy className="w-4 h-4 mr-1" /> Copia
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border rounded"
                        onClick={() => setShowCredModal(false)}
                      >
                        Chiudi
                      </button>
                      {createdProjectId && (
                        <Link href={`/dashboard/progetti/${createdProjectId}`} className="inline-flex items-center px-3 py-2 border rounded bg-black text-white">
                          Vai al progetto
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}