'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { projectService } from '@/services/projectService';
import { briefingService } from '@/services/briefingService';
import { clientService } from '@/services/clientService';
import { Project, BriefingFormData } from '@/types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CheckCircle, FileText, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase';

const schema = yup.object({
  // Informazioni sul Cliente
  nomeCompleto: yup.string().required('Nome completo richiesto'),
  nomeAzienda: yup.string(),
  codiceFiscaleOrPIVA: yup.string().required('Codice fiscale o P.IVA richiesto'),
  email: yup.string().email('Email non valida').required('Email richiesta'),
  telefono: yup.string().required('Telefono richiesto'),
  ruolo: yup.string().required('Ruolo richiesto'),
  
  // Obiettivi del Progetto
  obiettivoProgetto: yup.string().required('Obiettivo del progetto richiesto'),
  giaEsistente: yup.string().required('Campo richiesto'),
  scadenzaSpecifica: yup.string(),
  
  // Tipo di Progetto
  tipoProgetto: yup.string().required('Tipo di progetto richiesto'),
  tipoProgettoAltro: yup.string(),
  ambito: yup.string().required('Ambito richiesto'),
  
  // Funzionalità Richieste
  funzionalitaNecessarie: yup.string().required('Funzionalità necessarie richieste'),
  funzionalitaPrincipali: yup.string().required('Funzionalità principali richieste'),
  funzionalitaSecondarie: yup.string(),
  livelliUtenti: yup.string(),
  areeRiservate: yup.string(),
  
  // Design e UX
  designEsistente: yup.string().required('Campo richiesto'),
  sitiRiferimento: yup.string(),
  paletteColori: yup.string(),
  logoReady: yup.boolean(),
  
  // Integrazioni e Tecnologie
  serviziEsterni: yup.string(),
  piattaforme: yup.array().of(yup.string()).min(1, 'Seleziona almeno una piattaforma'),
  preferenzeTecniche: yup.string(),
  
  // Contenuti e Dati
  contenutiPronti: yup.string(),
  modalitaInvio: yup.string(),
  importazioneAltroSistema: yup.string(),
  
  // Hosting e Dominio
  haiDominio: yup.boolean(),
  haiHosting: yup.boolean(),
  serveAssistenza: yup.boolean(),
  
  // Supporto e Manutenzione
  tipoSupporto: yup.string().required('Tipo di supporto richiesto'),
  
  // Budget e Pagamento
  budgetStimato: yup.string(),
  modalitaPagamento: yup.string().required('Modalità di pagamento richiesta'),
  
  // Tempistiche
  scadenzaFinale: yup.string(),
  partiUrgenti: yup.string(),
  dataLancio: yup.string(),
  
  // Note Finali
  informazioniAggiuntive: yup.string(),
  restrizioniNormative: yup.string()
});

export default function BriefingPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [tempUserMode, setTempUserMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<BriefingFormData>({
    resolver: yupResolver<BriefingFormData>(schema as yup.AnyObjectSchema),
    defaultValues: {
      piattaforme: [],
      logoReady: false,
      haiDominio: false,
      haiHosting: false,
      serveAssistenza: false
    }
  });

  const watchTipoProgetto = watch('tipoProgetto');
  const watchPiattaforme = watch('piattaforme');

  useEffect(() => {
    // Só tenta carregar o projeto após autenticação
    if (user) {
      loadProject();
    }
  }, [params.id, user]);

  // Se não autenticado, exibe formulário de login restrito
  useEffect(() => {
    setTempUserMode(!user);
  }, [user]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await projectService.getProjectById(params.id as string);
      
      if (!projectData) {
        setError('Progetto non trovato');
        return;
      }
      
      if (projectData.briefingCompleted) {
        setSubmitted(true);
        return;
      }
      
      setProject(projectData);
    } catch (error) {
      console.error('Errore nel caricamento del progetto:', error);
      setError('Errore nel caricamento del progetto');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BriefingFormData) => {
    if (!project) return;
    
    try {
      setSubmitting(true);
      
      // Verificar se cliente já existe
      let clientId = project.clientId;
      const existingClient = await clientService.getClientByEmail(data.email);
      
      if (!existingClient) {
        // Criar novo cliente
        clientId = await clientService.createClient({
          nomeCompleto: data.nomeCompleto,
          nomeAzienda: data.nomeAzienda,
          codiceFiscaleOrPIVA: data.codiceFiscaleOrPIVA,
          email: data.email,
          telefono: data.telefono,
          ruolo: data.ruolo
        });
        
        // Atualizar projeto com novo cliente
        await projectService.updateProject(project.id, { clientId });
      }
      
      // Criar briefing
      await briefingService.createBriefing(data, project.id, clientId);
      
      // Marcar briefing como completado
      await projectService.markBriefingCompleted(project.id);
      
      setSubmitted(true);

      // Se usuário temporário, excluir acesso após submissão
      try {
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser?.user_metadata?.temp_briefing) {
          await fetch('/api/briefing/delete-temp-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          });
          await supabase.auth.signOut();
        }
      } catch (_) {
        // ignora falha de limpeza
      }
    } catch (error) {
      console.error('Errore nell\'invio del briefing:', error);
      setError('Errore nell\'invio del briefing. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTempLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoggingIn(true);
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      setTempUserMode(false);
      await loadProject();
    } catch (err) {
      setError('Credenziali non valide.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handlePiattaformaChange = (piattaforma: string, checked: boolean) => {
    const current = watchPiattaforme || [];
    if (checked) {
      setValue('piattaforme', [...current, piattaforma]);
    } else {
      setValue('piattaforme', current.filter(p => p !== piattaforma));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-light">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-600 mb-4">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <h2 className="text-lg font-semibold">Errore</h2>
            </div>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-light">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 mb-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <h2 className="text-lg font-semibold">Briefing Inviato!</h2>
            </div>
            <p className="text-gray-600">
              Grazie per aver completato il briefing. Ti contatteremo presto per discutere i dettagli del progetto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tempUserMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-light px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accedi per compilare il briefing</CardTitle>
            <CardDescription>Inserisci le credenziali ricevute via email</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
            )}
            <form onSubmit={handleTempLogin} className="space-y-3">
              <Input
                label="Email"
                type="email"
                placeholder="tuo@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loggingIn}>
                {loggingIn ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-light py-6">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary-custom">
              📋 BRIEFING DI SVILUPPO SOFTWARE / SITO / APP
            </CardTitle>
            <CardDescription>
              Progetto: {project?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 1. Informazioni sul Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🧑 1. Informazioni sul Cliente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nome completo"
                    placeholder="Mario Rossi"
                    error={errors.nomeCompleto?.message}
                    {...register('nomeCompleto')}
                  />
                  <Input
                    label="Nome dell'azienda (se presente)"
                    placeholder="Azienda S.r.l."
                    error={errors.nomeAzienda?.message}
                    {...register('nomeAzienda')}
                  />
                  <Input
                    label="Codice fiscale o P.IVA"
                    placeholder="RSSMRA80A01H501Z"
                    error={errors.codiceFiscaleOrPIVA?.message}
                    {...register('codiceFiscaleOrPIVA')}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="mario@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    label="Telefono / WhatsApp"
                    placeholder="+39 123 456 7890"
                    error={errors.telefono?.message}
                    {...register('telefono')}
                  />
                  <Input
                    label="Qual è il tuo ruolo/funzione?"
                    placeholder="CEO, Manager, etc."
                    error={errors.ruolo?.message}
                    {...register('ruolo')}
                  />
                </div>
              </div>

              {/* 2. Obiettivi del Progetto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🎯 2. Obiettivi del Progetto
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qual è l&#39;obiettivo principale del progetto? *
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Descrivi l&#39;obiettivo principale..."
                      {...register('obiettivoProgetto')}
                    />
                    {errors.obiettivoProgetto && (
                      <p className="mt-1 text-sm text-red-600">{errors.obiettivoProgetto.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hai già qualcosa sviluppato o stai iniziando da zero? *
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Descrivi lo stato attuale..."
                      {...register('giaEsistente')}
                    />
                    {errors.giaEsistente && (
                      <p className="mt-1 text-sm text-red-600">{errors.giaEsistente.message}</p>
                    )}
                  </div>
                  
                  <Input
                    label="Hai una scadenza specifica?"
                    placeholder="es. Entro 3 mesi, per Natale, etc."
                    error={errors.scadenzaSpecifica?.message}
                    {...register('scadenzaSpecifica')}
                  />
                </div>
              </div>

              {/* 3. Tipo di Progetto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🧩 3. Tipo di Progetto
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Che tipo di progetto è? *
                    </label>
                    <div className="space-y-2">
                      {['Sito istituzionale', 'E-commerce', 'Sistema Web', 'App Nativa (Android/iOS)', 'Altro'].map(tipo => (
                        <label key={tipo} className="flex items-center">
                          <input
                            type="radio"
                            value={tipo}
                            className="mr-2"
                            {...register('tipoProgetto')}
                          />
                          {tipo}
                        </label>
                      ))}
                    </div>
                    {watchTipoProgetto === 'Altro' && (
                      <Input
                        label="Specifica altro tipo"
                        placeholder="Descrivi il tipo di progetto..."
                        className="mt-2"
                        error={errors.tipoProgettoAltro?.message}
                        {...register('tipoProgettoAltro')}
                      />
                    )}
                    {errors.tipoProgetto && (
                      <p className="mt-1 text-sm text-red-600">{errors.tipoProgetto.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Il progetto sarà: *
                    </label>
                    <div className="space-y-2">
                      {['Solo front-end', 'Solo back-end', 'Completo (front-end + back-end)'].map(ambito => (
                        <label key={ambito} className="flex items-center">
                          <input
                            type="radio"
                            value={ambito}
                            className="mr-2"
                            {...register('ambito')}
                          />
                          {ambito}
                        </label>
                      ))}
                    </div>
                    {errors.ambito && (
                      <p className="mt-1 text-sm text-red-600">{errors.ambito.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Funzionalità Richieste */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  📱 4. Funzionalità Richieste
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Elenca tutte le funzionalità necessarie *
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="es. Login utenti, gestione prodotti, pagamenti..."
                      {...register('funzionalitaNecessarie')}
                    />
                    {errors.funzionalitaNecessarie && (
                      <p className="mt-1 text-sm text-red-600">{errors.funzionalitaNecessarie.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funzionalità principali *
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Le funzionalità più importanti del progetto..."
                      {...register('funzionalitaPrincipali')}
                    />
                    {errors.funzionalitaPrincipali && (
                      <p className="mt-1 text-sm text-red-600">{errors.funzionalitaPrincipali.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funzionalità secondarie desiderate
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Funzionalità che sarebbero utili ma non essenziali..."
                      {...register('funzionalitaSecondarie')}
                    />
                  </div>
                  
                  <Input
                    label="Livelli diversi di utenti?"
                    placeholder="es. Admin, utenti normali, guest..."
                    error={errors.livelliUtenti?.message}
                    {...register('livelliUtenti')}
                  />
                  
                  <Input
                    label="Aree con accesso riservato?"
                    placeholder="es. Area privata, dashboard admin..."
                    error={errors.areeRiservate?.message}
                    {...register('areeRiservate')}
                  />
                </div>
              </div>

              {/* 5. Design e UX */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🎨 5. Design e UX
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hai già un design? *
                    </label>
                    <div className="space-y-2">
                      {['Sì – file Figma/PSD', 'No – serve creazione'].map(design => (
                        <label key={design} className="flex items-center">
                          <input
                            type="radio"
                            value={design}
                            className="mr-2"
                            {...register('designEsistente')}
                          />
                          {design}
                        </label>
                      ))}
                    </div>
                    {errors.designEsistente && (
                      <p className="mt-1 text-sm text-red-600">{errors.designEsistente.message}</p>
                    )}
                  </div>
                  
                  <Input
                    label="Siti/app di riferimento?"
                    placeholder="URL di siti che ti piacciono..."
                    error={errors.sitiRiferimento?.message}
                    {...register('sitiRiferimento')}
                  />
                  
                  <Input
                    label="Palette di colori?"
                    placeholder="es. Blu e bianco, colori aziendali..."
                    error={errors.paletteColori?.message}
                    {...register('paletteColori')}
                  />
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      {...register('logoReady')}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Logo già pronto?
                    </label>
                  </div>
                </div>
              </div>

              {/* 6. Integrazioni e Tecnologie */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🔌 6. Integrazioni e Tecnologie
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Servizi esterni da integrare?"
                    placeholder="es. PayPal, Google Maps, CRM..."
                    error={errors.serviziEsterni?.message}
                    {...register('serviziEsterni')}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Piattaforme: *
                    </label>
                    <div className="space-y-2">
                      {['Web', 'Android', 'iOS'].map(piattaforma => (
                        <label key={piattaforma} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={watchPiattaforme?.includes(piattaforma) || false}
                            onChange={(e) => handlePiattaformaChange(piattaforma, e.target.checked)}
                          />
                          {piattaforma}
                        </label>
                      ))}
                    </div>
                    {errors.piattaforme && (
                      <p className="mt-1 text-sm text-red-600">{errors.piattaforme.message}</p>
                    )}
                  </div>
                  
                  <Input
                    label="Preferenze tecniche?"
                    placeholder="Tecnologie specifiche richieste..."
                    error={errors.preferenzeTecniche?.message}
                    {...register('preferenzeTecniche')}
                  />
                </div>
              </div>

              {/* 7. Contenuti e Dati */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🧾 7. Contenuti e Dati
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Contenuti pronti (testi, immagini, video)?"
                    placeholder="Cosa hai già pronto..."
                    error={errors.contenutiPronti?.message}
                    {...register('contenutiPronti')}
                  />
                  
                  <Input
                    label="Modalità di invio"
                    placeholder="Come invierai i contenuti..."
                    error={errors.modalitaInvio?.message}
                    {...register('modalitaInvio')}
                  />
                  
                  <Input
                    label="Importazione da altro sistema?"
                    placeholder="Dati da importare da sistemi esistenti..."
                    error={errors.importazioneAltroSistema?.message}
                    {...register('importazioneAltroSistema')}
                  />
                </div>
              </div>

              {/* 8. Hosting e Dominio */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  💻 8. Hosting e Dominio
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      {...register('haiDominio')}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Hai dominio?
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      {...register('haiHosting')}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Hai hosting?
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      {...register('serveAssistenza')}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Serve assistenza?
                    </label>
                  </div>
                </div>
              </div>

              {/* 9. Supporto e Manutenzione */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  🛠 9. Supporto e Manutenzione
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dopo la consegna: *
                  </label>
                  <div className="space-y-2">
                    {['Supporto occasionale', 'Manutenzione mensile', 'Nessun supporto'].map(supporto => (
                      <label key={supporto} className="flex items-center">
                        <input
                          type="radio"
                          value={supporto}
                          className="mr-2"
                          {...register('tipoSupporto')}
                        />
                        {supporto}
                      </label>
                    ))}
                  </div>
                  {errors.tipoSupporto && (
                    <p className="mt-1 text-sm text-red-600">{errors.tipoSupporto.message}</p>
                  )}
                </div>
              </div>

              {/* 10. Budget e Pagamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  💰 10. Budget e Pagamento
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Budget stimato?"
                    placeholder="es. 5.000€, da definire..."
                    error={errors.budgetStimato?.message}
                    {...register('budgetStimato')}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modalità di pagamento: *
                    </label>
                    <div className="space-y-2">
                      {['A fasi', 'Prezzo fisso', 'A ore'].map(modalita => (
                        <label key={modalita} className="flex items-center">
                          <input
                            type="radio"
                            value={modalita}
                            className="mr-2"
                            {...register('modalitaPagamento')}
                          />
                          {modalita}
                        </label>
                      ))}
                    </div>
                    {errors.modalitaPagamento && (
                      <p className="mt-1 text-sm text-red-600">{errors.modalitaPagamento.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 11. Tempistiche */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  📅 11. Tempistiche
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Scadenza finale?"
                    placeholder="es. Entro 6 mesi, per evento specifico..."
                    error={errors.scadenzaFinale?.message}
                    {...register('scadenzaFinale')}
                  />
                  
                  <Input
                    label="Parti urgenti?"
                    placeholder="Cosa deve essere fatto per primo..."
                    error={errors.partiUrgenti?.message}
                    {...register('partiUrgenti')}
                  />
                  
                  <Input
                    label="Data/evento di lancio?"
                    placeholder="Quando vuoi lanciare il progetto..."
                    error={errors.dataLancio?.message}
                    {...register('dataLancio')}
                  />
                </div>
              </div>

              {/* 12. Note Finali */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  📌 12. Note Finali
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Informazioni aggiuntive?
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Altre informazioni importanti..."
                      {...register('informazioniAggiuntive')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Restrizioni o normative?
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="GDPR, normative specifiche del settore..."
                      {...register('restrizioniNormative')}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary-gradient text-lg py-3"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Invia Briefing
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}