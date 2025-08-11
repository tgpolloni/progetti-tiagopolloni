'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { briefingService } from '@/services/briefingService';
import { Project, Client, BriefingFormData } from '@/types';
import { formatDate, getStatusColor, getStatusIcon, copyToClipboard } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  FileText,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  Pause,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const projectSchema = yup.object({
  nome: yup.string().required('Nome richiesto'),
  descrizione: yup.string(),
  status: yup.string().required('Status richiesto'),
  internalNotes: yup.string()
});

type ProjectFormData = {
  nome: string;
  descrizione: string | undefined;
  status: Project['status'];
  internalNotes: string | undefined;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [briefing, setBriefing] = useState<BriefingFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showBriefing, setShowBriefing] = useState(false);
  const [tempCred, setTempCred] = useState<{ email: string; password: string; expiresAt?: string } | null>(null);
  const [briefingLink, setBriefingLink] = useState<string>('');
  const [credError, setCredError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProjectFormData>({
    resolver: yupResolver(projectSchema)
  });

  useEffect(() => {
    loadProjectData();
  }, [params.id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const projectData = await projectService.getProjectById(params.id as string);
      
      if (!projectData) {
        setError('Progetto non trovato');
        return;
      }
      
      setProject(projectData);
      setBriefingLink(`${window.location.origin}/briefing/${projectData.id}`);
      reset({
        nome: projectData.nome,
        descrizione: projectData.descrizione,
        status: projectData.status,
        internalNotes: projectData.internalNotes
      });
      
      // Carica cliente
      if (projectData.clientId) {
        const clientData = await clientService.getClientById(projectData.clientId);
        setClient(clientData);
      }
      // Recupera credenziali temporanee se presenti (indipendente dal clientId)
      try {
        const res = await fetch(`/api/temp-users/by-project?projectId=${projectData.id}`);
        if (res.ok) {
          const j = await res.json();
          if (j && j.email && j.password) setTempCred(j);
        }
      } catch (_) {}
      
      // Carica briefing se completato
      if (projectData.briefingCompleted) {
        const briefingData = await briefingService.getBriefingByProjectId(projectData.id);
        setBriefing(briefingData);
      }
    } catch (error) {
      console.error('Errore nel caricamento del progetto:', error);
      setError('Errore nel caricamento del progetto');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!project) return;
    
    try {
      setSaving(true);
      await projectService.updateProject(project.id, data);
      setProject({ ...project, ...data, updatedAt: new Date() } as Project);
      setEditing(false);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del progetto:', error);
      setError('Errore nell\'aggiornamento del progetto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !confirm('Sei sicuro di voler eliminare questo progetto?')) return;
    
    try {
      setDeleting(true);
      await projectService.deleteProject(project.id);
      router.push('/dashboard/progetti');
    } catch (error) {
      console.error('Errore nell\'eliminazione del progetto:', error);
      setError('Errore nell\'eliminazione del progetto');
    } finally {
      setDeleting(false);
    }
  };

  const copyBriefingLink = async () => {
    if (!project) return;
    const link = `${window.location.origin}/briefing/${project.id}`;
    const ok = await copyToClipboard(link);
    if (!ok) {
      alert('Impossibile copiare il link negli appunti. Copia manualmente: ' + link);
    }
    // TODO: opzionale, mostrare toast di successo
  };

  const openBriefingLink = () => {
    if (!project) return;
    const link = `${window.location.origin}/briefing/${project.id}`;
    window.open(link, '_blank');
  };

  const generateSafePassword = (): string => {
    // 4 dígitos numéricos
    const n = Math.floor(1000 + Math.random() * 9000); // 1000..9999
    return String(n);
  };

  const handleRegeneraCredenziali = async () => {
    if (!project || !client?.email) return;
    setCredError('');
    try {
      // 1) elimina eventuale utente temporaneo precedente
      await fetch('/api/briefing/delete-temp-by-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, email: client.email })
      }).catch(() => undefined);

      // 2) crea nuove credenziali
      const password = generateSafePassword();
      const res = await fetch('/api/briefing/create-temp-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, email: client.email, password })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Errore nella rigenerazione delle credenziali');
      }
      setTempCred({ email: client.email, password });
    } catch (e: unknown) {
      setCredError('Impossibile rigenerare le credenziali. Verifica SUPABASE_SERVICE_ROLE_KEY.');
    }
  };

  // Handlers per Azioni Rapide
  const handleInviaEmail = () => {
    if (!client) {
      alert('Nessun cliente associato al progetto');
      return;
    }
    // Naviga alla pagina email con parametri del progetto
    router.push(`/dashboard/email?projectId=${project?.id}&clientEmail=${client.email}&clientName=${encodeURIComponent(client.nomeCompleto)}`);
  };

  const handleGeneraReport = () => {
    if (!project) return;
    
    // Genera un report PDF del progetto
    const reportData = {
      progetto: project.nome,
      cliente: client?.nomeCompleto || 'N/A',
      azienda: client?.nomeAzienda || 'N/A',
      status: project.status,
      dataInizio: project.dataInizio ? formatDate(new Date(project.dataInizio)) : 'N/A',
      dataFinePrevista: project.dataFinePrevista ? formatDate(new Date(project.dataFinePrevista)) : 'N/A',
      budget: project.budget || 'N/A',
      descrizione: project.descrizione || 'N/A',
      noteInterne: project.internalNotes || 'N/A'
    };
    
    // Crea contenuto del report
    const reportContent = `
=== REPORT PROGETTO ===

Progetto: ${reportData.progetto}
Cliente: ${reportData.cliente}
Azienda: ${reportData.azienda}
Status: ${reportData.status}
Data Inizio: ${reportData.dataInizio}
Data Fine Prevista: ${reportData.dataFinePrevista}
Budget: ${reportData.budget}

Descrizione:
${reportData.descrizione}

Note Interne:
${reportData.noteInterne}

Generato il: ${formatDate(new Date())}
    `;
    
    // Download del report come file di testo
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${project.nome.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleProgrammaRiunione = () => {
    if (!client) {
      alert('Nessun cliente associato al progetto');
      return;
    }
    
    // Crea un evento calendario
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Domani
    startDate.setHours(10, 0, 0, 0); // 10:00
    
    const endDate = new Date(startDate);
    endDate.setHours(11, 0, 0, 0); // 11:00
    
    const formatDateForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const eventDetails = {
      title: `Riunione - ${project?.nome}`,
      start: formatDateForCalendar(startDate),
      end: formatDateForCalendar(endDate),
      description: `Riunione per il progetto: ${project?.nome}\nCliente: ${client.nomeCompleto}\nEmail: ${client.email}\nTelefono: ${client.telefono || 'N/A'}`,
      location: 'Online / Ufficio'
    };
    
    // Crea link Google Calendar
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${eventDetails.start}/${eventDetails.end}&details=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleContinueFromHere = () => {
    if (!project) return;
    const link = `${window.location.origin}/briefing/${project.id}`;
    window.open(link, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In attesa di briefing':
        return <Clock className="h-4 w-4" />;
      case 'In corso':
        return <CheckCircle className="h-4 w-4" />;
      case 'Pausa':
        return <Pause className="h-4 w-4" />;
      case 'Completato':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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

  if (error || !project) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
            <p className="text-gray-600 mb-4">{error || 'Progetto non trovato'}</p>
            <Button onClick={() => router.push('/dashboard/progetti')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Progetti
            </Button>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/progetti')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Progetti
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.nome}</h1>
            {project && (
              <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1">{project.status}</span>
                  </span>
                <span className="text-sm text-gray-500">
                  Creato il {formatDate(project.createdAt)}
                </span>
              </div>
            )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!editing && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Elimina
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informazioni Progetto */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dettagli Progetto</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <Input
                        label="Nome Progetto"
                        error={errors.nome?.message}
                        {...register('nome')}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrizione
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          {...register('descrizione')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Note Interne
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Note private sul progetto..."
                          {...register('internalNotes')}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : null}
                          Salva
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditing(false);
                            reset();
                          }}
                        >
                          Annulla
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Descrizione</h4>
                        <p className="text-gray-900 mt-1">
                          {project.descrizione || 'Nessuna descrizione'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Note Interne</h4>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                          {project.internalNotes || 'Nessuna nota'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Creato</h4>
                          <p className="text-gray-900 mt-1">{formatDate(project.createdAt)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Aggiornato</h4>
                          <p className="text-gray-900 mt-1">
                            {project.updatedAt ? formatDate(project.updatedAt) : 'Mai'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Briefing */}
              {project.briefingCompleted && briefing ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        Briefing Completato
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBriefing(!showBriefing)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {showBriefing ? 'Nascondi' : 'Mostra'} Dettagli
                      </Button>
                    </div>
                  </CardHeader>
                  {showBriefing && (
                    <CardContent>
                      <div className="space-y-6">
                        {/* Informazioni Cliente */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🧑 Informazioni Cliente</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Nome:</span>
                              <span className="ml-2 text-gray-900">{briefing.nomeCompleto}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Azienda:</span>
                              <span className="ml-2 text-gray-900">{briefing.nomeAzienda || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <span className="ml-2 text-gray-900">{briefing.email}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Telefono:</span>
                              <span className="ml-2 text-gray-900">{briefing.telefono}</span>
                            </div>
                          </div>
                        </div>

                        {/* Obiettivi */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🎯 Obiettivi del Progetto</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{briefing.obiettivoProgetto}</p>
                        </div>

                        {/* Tipo di Progetto */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🧩 Tipo di Progetto</h4>
                          <div className="text-sm">
                            <p><span className="text-gray-600">Tipo:</span> <span className="ml-2 text-gray-900">{briefing.tipoProgetto}</span></p>
                            <p><span className="text-gray-600">Ambito:</span> <span className="ml-2 text-gray-900">{briefing.ambito}</span></p>
                            {briefing.piattaforme && briefing.piattaforme.length > 0 && (
                              <p><span className="text-gray-600">Piattaforme:</span> <span className="ml-2 text-gray-900">{briefing.piattaforme.join(', ')}</span></p>
                            )}
                          </div>
                        </div>

                        {/* Funzionalità */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">📱 Funzionalità Richieste</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600 font-medium">Principali:</span>
                              <p className="text-gray-700 whitespace-pre-wrap">{briefing.funzionalitaPrincipali}</p>
                            </div>
                            {briefing.funzionalitaSecondarie && (
                              <div>
                                <span className="text-gray-600 font-medium">Secondarie:</span>
                                <p className="text-gray-700 whitespace-pre-wrap">{briefing.funzionalitaSecondarie}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Budget e Tempistiche */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">💰 Budget</h4>
                            <p className="text-sm text-gray-700">{briefing.budgetStimato || 'Non specificato'}</p>
                            <p className="text-sm text-gray-600">Modalità: {briefing.modalitaPagamento}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">📅 Tempistiche</h4>
                            <p className="text-sm text-gray-700">{briefing.scadenzaFinale || 'Non specificata'}</p>
                          </div>
                        </div>

                        {/* Dettagli aggiuntivi - mostra tutte le risposte disponibili */}
                        <div className="space-y-6">
                          {/* Dati aggiuntivi cliente */}
                          {(briefing.codiceFiscaleOrPIVA || briefing.ruolo) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">👤 Dettagli Cliente</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {briefing.codiceFiscaleOrPIVA && (
                                  <p><span className="text-gray-600">CF/P.IVA:</span> <span className="ml-2 text-gray-900">{briefing.codiceFiscaleOrPIVA}</span></p>
                                )}
                                {briefing.ruolo && (
                                  <p><span className="text-gray-600">Ruolo:</span> <span className="ml-2 text-gray-900">{briefing.ruolo}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Contesto Progetto */}
                          {(briefing.giaEsistente || briefing.scadenzaSpecifica) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">📌 Contesto Progetto</h4>
                              <div className="space-y-1 text-sm">
                                {briefing.giaEsistente && (
                                  <p><span className="text-gray-600">Già esistente:</span> <span className="ml-2 text-gray-900">{briefing.giaEsistente}</span></p>
                                )}
                                {briefing.scadenzaSpecifica && (
                                  <p><span className="text-gray-600">Scadenza specifica:</span> <span className="ml-2 text-gray-900">{briefing.scadenzaSpecifica}</span></p>
                                )}
                                {briefing.tipoProgettoAltro && (
                                  <p><span className="text-gray-600">Tipo Progetto (altro):</span> <span className="ml-2 text-gray-900">{briefing.tipoProgettoAltro}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Dettagli Funzionalità extra */}
                          {(briefing.livelliUtenti || briefing.areeRiservate) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">🔐 Accessi e Sezioni</h4>
                              <div className="space-y-1 text-sm">
                                {briefing.livelliUtenti && (
                                  <p><span className="text-gray-600">Livelli utenti:</span> <span className="ml-2 text-gray-900">{briefing.livelliUtenti}</span></p>
                                )}
                                {briefing.areeRiservate && (
                                  <p><span className="text-gray-600">Aree riservate:</span> <span className="ml-2 text-gray-900">{briefing.areeRiservate}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Design e UX */}
                          {(briefing.designEsistente || briefing.sitiRiferimento || briefing.paletteColori || typeof briefing.logoReady === 'boolean') && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">🎨 Design e UX</h4>
                              <div className="space-y-1 text-sm">
                                {briefing.designEsistente && (
                                  <p><span className="text-gray-600">Design esistente:</span> <span className="ml-2 text-gray-900">{briefing.designEsistente}</span></p>
                                )}
                                {briefing.sitiRiferimento && (
                                  <p><span className="text-gray-600">Siti di riferimento:</span> <span className="ml-2 text-gray-900 whitespace-pre-wrap">{briefing.sitiRiferimento}</span></p>
                                )}
                                {briefing.paletteColori && (
                                  <p><span className="text-gray-600">Palette colori:</span> <span className="ml-2 text-gray-900">{briefing.paletteColori}</span></p>
                                )}
                                {typeof briefing.logoReady === 'boolean' && (
                                  <p><span className="text-gray-600">Logo pronto:</span> <span className="ml-2 text-gray-900">{briefing.logoReady ? 'Sì' : 'No'}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Integrazioni e Tecnologie */}
                          {(briefing.serviziEsterni || briefing.preferenzeTecniche) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">🔌 Integrazioni e Tecnologie</h4>
                              <div className="space-y-1 text-sm">
                                {briefing.serviziEsterni && (
                                  <p><span className="text-gray-600">Servizi esterni:</span> <span className="ml-2 text-gray-900 whitespace-pre-wrap">{briefing.serviziEsterni}</span></p>
                                )}
                                {briefing.preferenzeTecniche && (
                                  <p><span className="text-gray-600">Preferenze tecniche:</span> <span className="ml-2 text-gray-900 whitespace-pre-wrap">{briefing.preferenzeTecniche}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Contenuti e Dati */}
                          {(briefing.contenutiPronti || briefing.modalitaInvio || briefing.importazioneAltroSistema) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">🗂️ Contenuti e Dati</h4>
                              <div className="space-y-1 text-sm">
                                {briefing.contenutiPronti && (
                                  <p><span className="text-gray-600">Contenuti pronti:</span> <span className="ml-2 text-gray-900 whitespace-pre-wrap">{briefing.contenutiPronti}</span></p>
                                )}
                                {briefing.modalitaInvio && (
                                  <p><span className="text-gray-600">Modalità invio:</span> <span className="ml-2 text-gray-900">{briefing.modalitaInvio}</span></p>
                                )}
                                {briefing.importazioneAltroSistema && (
                                  <p><span className="text-gray-600">Importazione da altri sistemi:</span> <span className="ml-2 text-gray-900 whitespace-pre-wrap">{briefing.importazioneAltroSistema}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Hosting e Dominio */}
                          {(typeof briefing.haiDominio === 'boolean' || typeof briefing.haiHosting === 'boolean' || typeof briefing.serveAssistenza === 'boolean' || briefing.tipoSupporto) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">🌐 Hosting e Dominio</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {typeof briefing.haiDominio === 'boolean' && (
                                  <p><span className="text-gray-600">Hai dominio:</span> <span className="ml-2 text-gray-900">{briefing.haiDominio ? 'Sì' : 'No'}</span></p>
                                )}
                                {typeof briefing.haiHosting === 'boolean' && (
                                  <p><span className="text-gray-600">Hai hosting:</span> <span className="ml-2 text-gray-900">{briefing.haiHosting ? 'Sì' : 'No'}</span></p>
                                )}
                                {typeof briefing.serveAssistenza === 'boolean' && (
                                  <p><span className="text-gray-600">Serve assistenza:</span> <span className="ml-2 text-gray-900">{briefing.serveAssistenza ? 'Sì' : 'No'}</span></p>
                                )}
                                {briefing.tipoSupporto && (
                                  <p><span className="text-gray-600">Tipo di supporto:</span> <span className="ml-2 text-gray-900">{briefing.tipoSupporto}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Dettagli tempistiche extra */}
                          {(briefing.partiUrgenti || briefing.dataLancio) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">⏱️ Dettagli Tempistiche</h4>
                              <div className="space-y-1 text-sm">
                                {briefing.partiUrgenti && (
                                  <p><span className="text-gray-600">Parti urgenti:</span> <span className="ml-2 text-gray-900 whitespace-pre-wrap">{briefing.partiUrgenti}</span></p>
                                )}
                                {briefing.dataLancio && (
                                  <p><span className="text-gray-600">Data di lancio:</span> <span className="ml-2 text-gray-900">{briefing.dataLancio}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Note Finali */}
                          {(briefing.informazioniAggiuntive || briefing.restrizioniNormative) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">📝 Note Finali</h4>
                              <div className="space-y-1 text-sm">
                                {briefing.informazioniAggiuntive && (
                                  <p className="whitespace-pre-wrap"><span className="text-gray-600">Informazioni aggiuntive:</span> <span className="ml-2 text-gray-900">{briefing.informazioniAggiuntive}</span></p>
                                )}
                                {briefing.restrizioniNormative && (
                                  <p className="whitespace-pre-wrap"><span className="text-gray-600">Restrizioni normative:</span> <span className="ml-2 text-gray-900">{briefing.restrizioniNormative}</span></p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      Briefing in Attesa
                    </CardTitle>
                    <CardDescription>
                      Il cliente non ha ancora completato il briefing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {credError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{credError}</div>
                    )}
                    {tempCred && (
                      <div className="mb-4 p-3 border rounded-md">
                        <p className="text-sm text-gray-700 mb-2">Credenziali temporanee</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-gray-500">Email</span>
                            <div className="flex items-center">
                              <code className="text-sm text-gray-800 break-all flex-1">{tempCred.email}</code>
                              <Button variant="outline" size="sm" className="ml-2"
                                onClick={async () => { await copyToClipboard(tempCred.email); }}>
                                <Copy className="h-4 w-4 mr-1" /> Copia
                              </Button>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Password</span>
                            <div className="flex items-center">
                              <code className="text-sm text-gray-800 break-all flex-1">{tempCred.password}</code>
                              <Button variant="outline" size="sm" className="ml-2"
                                onClick={async () => { await copyToClipboard(tempCred.password); }}>
                                <Copy className="h-4 w-4 mr-1" /> Copia
                              </Button>
                            </div>
                          </div>
                        </div>
                        {tempCred.expiresAt && (
                          <p className="text-xs text-gray-500 mt-2">Scade: {new Date(tempCred.expiresAt).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                    {!tempCred && (
                      <div className="mb-4 p-3 border rounded-md">
                        <p className="text-sm text-gray-700 mb-2">Credenziali temporanee</p>
                        <p className="text-xs text-gray-500 mb-2">Nessuna credenziale salvata trovata. Puoi rigenerarle ora.</p>
                        <Button variant="outline" size="sm" onClick={handleRegeneraCredenziali}>Rigenera credenziali</Button>
                      </div>
                    )}

                      <div className="flex space-x-2">
                      <Button onClick={copyBriefingLink} variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copia Link
                      </Button>
                      <Button onClick={openBriefingLink} variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apri Link
                      </Button>
                    </div>
                    {briefingLink && (
                      <p className="text-sm text-gray-600 mt-2">
                        Link: {briefingLink}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Informazioni Cliente */}
              {client && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Nome</h4>
                        <p className="text-gray-900">{client.nomeCompleto}</p>
                      </div>
                      {client.nomeAzienda && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Azienda</h4>
                          <p className="text-gray-900">{client.nomeAzienda}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Email</h4>
                          <p className="text-gray-900 break-all">{client.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Telefono</h4>
                        <p className="text-gray-900">{client.telefono}</p>
                      </div>
                      {client.codiceFiscaleOrPIVA && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Codice Fiscale/P.IVA</h4>
                          <p className="text-gray-900">{client.codiceFiscaleOrPIVA}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Azioni Rapide */}
              <Card>
                <CardHeader>
                  <CardTitle>Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleInviaEmail}
                      disabled={!client}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Invia Email
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleGeneraReport}
                      disabled={!project}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Genera Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleProgrammaRiunione}
                      disabled={!client}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Programma Riunione
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}