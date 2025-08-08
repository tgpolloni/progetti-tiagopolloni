'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  
  // Contenuti
  contenutiPronti: yup.string(),
  modalitaInvio: yup.string(),
  importazioneAltroSistema: yup.string(),
  
  // Hosting e Dominio
  haiDominio: yup.boolean(),
  haiHosting: yup.boolean(),
  serveAssistenza: yup.boolean(),
  
  // Supporto e Manutenzione
  tipoSupporto: yup.string().required('Tipo di supporto richiesto'),
  
  // Budget
  budgetStimato: yup.string(),
  modalitaPagamento: yup.string().required('Modalità di pagamento richiesta'),
  
  // Timeline
  scadenzaFinale: yup.string(),
  partiUrgenti: yup.string(),
  dataLancio: yup.string(),
  
  // Informazioni Aggiuntive
  informazioniAggiuntive: yup.string(),
  restrizioniNormative: yup.string()
});

export default function PublicBriefingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<BriefingFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      logoReady: false,
      haiDominio: false,
      haiHosting: false,
      serveAssistenza: false,
      piattaforme: []
    }
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Errore nel caricamento dei progetti:', error);
    }
  };

  const onSubmit = async (data: BriefingFormData) => {
    setIsSubmitting(true);
    try {
      // Create or get client
      let clientId;
      const existingClient = await clientService.getClientByEmail(data.email);
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const newClient = await clientService.createClient({
          nomeCompleto: data.nomeCompleto,
          nomeAzienda: data.nomeAzienda || '',
          codiceFiscaleOrPIVA: data.codiceFiscaleOrPIVA,
          email: data.email,
          telefono: data.telefono,
          ruolo: data.ruolo
        });
        clientId = newClient.id;
      }

      // Create briefing
      const briefingData = {
        ...data,
        clientId,
        projectId: selectedProject || null,
        status: 'nuovo' as const,
        dataCreazione: new Date().toISOString()
      };

      await briefingService.createBriefing(briefingData, selectedProject, clientId);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Errore nell\'invio del briefing:', error);
      alert('Errore nell\'invio del briefing. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Briefing Inviato!</CardTitle>
            <CardDescription>
              Grazie per aver compilato il briefing. Ti contatteremo presto per discutere il tuo progetto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Torna alla Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Briefing Progetto</h1>
          <p className="text-xl text-gray-600">
            Compila questo form per aiutarci a comprendere meglio le tue esigenze
          </p>
          <div className="mt-6">
            <div className="flex justify-center items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Passo {currentStep} di {totalSteps}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {currentStep === 1 && 'Informazioni Cliente'}
              {currentStep === 2 && 'Obiettivi del Progetto'}
              {currentStep === 3 && 'Tipo di Progetto'}
              {currentStep === 4 && 'Funzionalità Richieste'}
              {currentStep === 5 && 'Design e UX'}
              {currentStep === 6 && 'Tecnologie e Integrazioni'}
              {currentStep === 7 && 'Budget e Timeline'}
              {currentStep === 8 && 'Informazioni Aggiuntive'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Client Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo *
                      </label>
                      <Input
                        {...register('nomeCompleto')}
                        placeholder="Il tuo nome completo"
                      />
                      {errors.nomeCompleto && (
                        <p className="text-red-500 text-sm mt-1">{errors.nomeCompleto.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Azienda
                      </label>
                      <Input
                        {...register('nomeAzienda')}
                        placeholder="Nome della tua azienda (opzionale)"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Codice Fiscale o P.IVA *
                      </label>
                      <Input
                        {...register('codiceFiscaleOrPIVA')}
                        placeholder="CF o P.IVA"
                      />
                      {errors.codiceFiscaleOrPIVA && (
                        <p className="text-red-500 text-sm mt-1">{errors.codiceFiscaleOrPIVA.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        {...register('email')}
                        placeholder="la-tua-email@esempio.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefono *
                      </label>
                      <Input
                        {...register('telefono')}
                        placeholder="+39 123 456 7890"
                      />
                      {errors.telefono && (
                        <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ruolo *
                      </label>
                      <Input
                        {...register('ruolo')}
                        placeholder="Es. CEO, Marketing Manager, etc."
                      />
                      {errors.ruolo && (
                        <p className="text-red-500 text-sm mt-1">{errors.ruolo.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Project Objectives */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qual è l'obiettivo principale del progetto? *
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrivi l'obiettivo principale..."
                      {...register('obiettivoProgetto')}
                    />
                    {errors.obiettivoProgetto && (
                      <p className="text-red-500 text-sm mt-1">{errors.obiettivoProgetto.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hai già qualcosa sviluppato o stai iniziando da zero? *
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrivi lo stato attuale..."
                      {...register('giaEsistente')}
                    />
                    {errors.giaEsistente && (
                      <p className="text-red-500 text-sm mt-1">{errors.giaEsistente.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hai una scadenza specifica?
                    </label>
                    <Input
                      {...register('scadenzaSpecifica')}
                      placeholder="es. Entro 3 mesi, per Natale, etc."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Project Type */}
              {currentStep === 3 && (
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
                    {watch('tipoProgetto') === 'Altro' && (
                      <Input
                        {...register('tipoProgettoAltro')}
                        placeholder="Descrivi il tipo di progetto..."
                        className="mt-2"
                      />
                    )}
                    {errors.tipoProgetto && (
                      <p className="text-red-500 text-sm mt-1">{errors.tipoProgetto.message}</p>
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
                      <p className="text-red-500 text-sm mt-1">{errors.ambito.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Required Features */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quali funzionalità sono assolutamente necessarie? *
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Elenca le funzionalità essenziali..."
                      {...register('funzionalitaNecessarie')}
                    />
                    {errors.funzionalitaNecessarie && (
                      <p className="text-red-500 text-sm mt-1">{errors.funzionalitaNecessarie.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quali sono le 3 funzionalità principali? *
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1. Prima funzionalità\n2. Seconda funzionalità\n3. Terza funzionalità"
                      {...register('funzionalitaPrincipali')}
                    />
                    {errors.funzionalitaPrincipali && (
                      <p className="text-red-500 text-sm mt-1">{errors.funzionalitaPrincipali.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funzionalità secondarie (opzionali)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Funzionalità che sarebbero utili ma non essenziali..."
                      {...register('funzionalitaSecondarie')}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Design and UX */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hai già un design o delle linee guida grafiche? *
                    </label>
                    <div className="space-y-2">
                      {['Sì, ho tutto pronto', 'Ho solo alcune idee', 'No, serve tutto da zero'].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            value={option}
                            className="mr-2"
                            {...register('designEsistente')}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                    {errors.designEsistente && (
                      <p className="text-red-500 text-sm mt-1">{errors.designEsistente.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hai dei siti di riferimento che ti piacciono?
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Inserisci URL o nomi di siti che ti ispirano..."
                      {...register('sitiRiferimento')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hai preferenze per colori o palette?
                    </label>
                    <Input
                      {...register('paletteColori')}
                      placeholder="es. Blu e bianco, colori aziendali, etc."
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      {...register('logoReady')}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Ho già un logo pronto
                    </label>
                  </div>
                </div>
              )}

              {/* Step 6: Technologies and Integrations */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servizi esterni da integrare
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="es. PayPal, Stripe, Google Maps, social media..."
                      {...register('serviziEsterni')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Piattaforme target *
                    </label>
                    <div className="space-y-2">
                      {['Web (Desktop)', 'Web (Mobile)', 'iOS', 'Android'].map(platform => (
                        <label key={platform} className="flex items-center">
                          <input
                            type="checkbox"
                            value={platform}
                            className="mr-2"
                            {...register('piattaforme')}
                          />
                          {platform}
                        </label>
                      ))}
                    </div>
                    {errors.piattaforme && (
                      <p className="text-red-500 text-sm mt-1">{errors.piattaforme.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferenze tecniche specifiche
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="es. React, WordPress, linguaggi specifici..."
                      {...register('preferenzeTecniche')}
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Budget and Timeline */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget stimato
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register('budgetStimato')}
                    >
                      <option value="">Seleziona una fascia</option>
                      <option value="< 1.000€">Meno di 1.000€</option>
                      <option value="1.000€ - 5.000€">1.000€ - 5.000€</option>
                      <option value="5.000€ - 10.000€">5.000€ - 10.000€</option>
                      <option value="10.000€ - 25.000€">10.000€ - 25.000€</option>
                      <option value="> 25.000€">Oltre 25.000€</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modalità di pagamento preferita *
                    </label>
                    <div className="space-y-2">
                      {['Pagamento unico', 'Rate mensili', 'Milestone del progetto'].map(modalita => (
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
                      <p className="text-red-500 text-sm mt-1">{errors.modalitaPagamento.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scadenza finale desiderata
                    </label>
                    <Input
                      type="date"
                      {...register('scadenzaFinale')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo di supporto richiesto *
                    </label>
                    <div className="space-y-2">
                      {['Solo sviluppo', 'Sviluppo + manutenzione', 'Sviluppo + hosting + manutenzione'].map(supporto => (
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
                      <p className="text-red-500 text-sm mt-1">{errors.tipoSupporto.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 8: Additional Information */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Informazioni aggiuntive
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Qualsiasi altra informazione che ritieni importante..."
                      {...register('informazioniAggiuntive')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Restrizioni normative o compliance
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="es. GDPR, accessibilità, settori regolamentati..."
                      {...register('restrizioniNormative')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        {...register('haiDominio')}
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Ho già un dominio
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        {...register('haiHosting')}
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Ho già un hosting
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        {...register('serveAssistenza')}
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Serve assistenza per dominio/hosting
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Indietro
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Avanti
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Invio...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Invia Briefing
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}