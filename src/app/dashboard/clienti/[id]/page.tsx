'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import { Client, Project } from '@/types';
import { formatDate, validateEmail, validateCodiceFiscaleOrPIVA } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ArrowLeft,
  Save,
  Trash2,
  User,
  Building,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const schema = yup.object({
  nomeCompleto: yup.string().required('Nome completo richiesto'),
  nomeAzienda: yup.string(),
  codiceFiscaleOrPIVA: yup.string().required('Codice fiscale o P.IVA richiesto'),
  email: yup.string().email('Email non valida').required('Email richiesta'),
  telefono: yup.string().required('Telefono richiesto'),
  ruolo: yup.string()
});

type ClientFormData = {
  nomeCompleto: string;
  nomeAzienda?: string;
  codiceFiscaleOrPIVA: string;
  email: string;
  telefono: string;
  ruolo?: string;
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'nuovo';
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ClientFormData>({
    resolver: yupResolver(schema)
  });

  const watchEmail = watch('email');
  const watchCodiceFiscale = watch('codiceFiscaleOrPIVA');

  useEffect(() => {
    if (!isNew) {
      loadClientData();
    }
  }, [params.id, isNew]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const clientData = await clientService.getClientById(params.id as string);
      
      if (!clientData) {
        setError('Cliente non trovato');
        return;
      }
      
      setClient(clientData);
      reset({
        nomeCompleto: clientData.nomeCompleto,
        nomeAzienda: clientData.nomeAzienda,
        codiceFiscaleOrPIVA: clientData.codiceFiscaleOrPIVA,
        email: clientData.email,
        telefono: clientData.telefono,
        ruolo: clientData.ruolo
      });
      
      // Carica progetti del cliente
      const projectsData = await projectService.getProjectsByClient(clientData.id);
      setProjects(projectsData);
    } catch (error) {
      console.error('Errore nel caricamento del cliente:', error);
      setError('Errore nel caricamento del cliente');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Validazioni aggiuntive
      if (!validateEmail(data.email)) {
        setError('Email non valida');
        return;
      }
      
      if (!validateCodiceFiscaleOrPIVA(data.codiceFiscaleOrPIVA)) {
        setError('Codice fiscale o P.IVA non valido');
        return;
      }
      
      if (isNew) {
        // Verifica se cliente già esiste
        const existingByEmail = await clientService.getClientByEmail(data.email);
        if (existingByEmail) {
          setError('Esiste già un cliente con questa email');
          return;
        }
        
        const existingByCode = await clientService.checkClientExists(data.codiceFiscaleOrPIVA);
        if (existingByCode) {
          setError('Esiste già un cliente con questo codice fiscale/P.IVA');
          return;
        }
        
        // Crea nuovo cliente
        const clientId = await clientService.createClient(data);
        setSuccess('Cliente creato con successo!');
        
        // Reindirizza alla pagina del cliente
        setTimeout(() => {
          router.push(`/dashboard/clienti/${clientId}`);
        }, 1500);
      } else {
        // Aggiorna cliente esistente
        if (!client) return;
        
        // Verifica se email è cambiata e se esiste già
        if (data.email !== client.email) {
          const existingByEmail = await clientService.getClientByEmail(data.email);
          if (existingByEmail && existingByEmail.id !== client.id) {
            setError('Esiste già un cliente con questa email');
            return;
          }
        }
        
        // Verifica se codice fiscale è cambiato e se esiste già
        if (data.codiceFiscaleOrPIVA !== client.codiceFiscaleOrPIVA) {
          const existingByCode = await clientService.checkClientExists(data.codiceFiscaleOrPIVA);
          if (existingByCode) {
            setError('Esiste già un cliente con questo codice fiscale/P.IVA');
            return;
          }
        }
        
        await clientService.updateClient(client.id, data);
        setClient({ ...client, ...data, updatedAt: new Date() });
        setSuccess('Cliente aggiornato con successo!');
      }
    } catch (error) {
      console.error('Errore nel salvataggio del cliente:', error);
      setError('Errore nel salvataggio del cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client || projects.length > 0) return;
    
    if (!confirm('Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      setDeleting(true);
      await clientService.deleteClient(client.id);
      router.push('/dashboard/clienti');
    } catch (error) {
      console.error('Errore nell\'eliminazione del cliente:', error);
      setError('Errore nell\'eliminazione del cliente');
    } finally {
      setDeleting(false);
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

  if (error && !client && !isNew) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard/clienti')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Clienti
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/clienti')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Clienti
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNew ? 'Nuovo Cliente' : client?.nomeCompleto}
                </h1>
                <p className="text-gray-600">
                  {isNew ? 'Aggiungi un nuovo cliente' : 'Modifica informazioni cliente'}
                </p>
              </div>
            </div>
            
            {!isNew && client && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || projects.length > 0}
                title={projects.length > 0 ? 'Impossibile eliminare: cliente ha progetti associati' : ''}
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Elimina
              </Button>
            )}
          </div>

          {/* Messaggi */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-600">{success}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Cliente */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informazioni Cliente
                  </CardTitle>
                  <CardDescription>
                    {isNew ? 'Inserisci i dati del nuovo cliente' : 'Modifica i dati del cliente'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Informazioni Personali */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Dati Personali</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Nome Completo"
                          placeholder="Mario Rossi"
                          error={errors.nomeCompleto?.message}
                          {...register('nomeCompleto')}
                        />
                        
                        <Input
                          label="Ruolo/Funzione"
                          placeholder="CEO, Manager, etc."
                          error={errors.ruolo?.message}
                          {...register('ruolo')}
                        />
                      </div>
                      
                      <Input
                        label="Nome Azienda (opzionale)"
                        placeholder="Azienda S.r.l."
                        error={errors.nomeAzienda?.message}
                        {...register('nomeAzienda')}
                      />
                    </div>

                    {/* Contatti */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Contatti</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Email"
                          type="email"
                          placeholder="mario@example.com"
                          error={errors.email?.message}
                          {...register('email')}
                        />
                        
                        <Input
                          label="Telefono"
                          placeholder="+39 123 456 7890"
                          error={errors.telefono?.message}
                          {...register('telefono')}
                        />
                      </div>
                    </div>

                    {/* Dati Fiscali */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Dati Fiscali</h3>
                      
                      <Input
                        label="Codice Fiscale o P.IVA"
                        placeholder="RSSMRA80A01H501Z o 12345678901"
                        error={errors.codiceFiscaleOrPIVA?.message}
                        {...register('codiceFiscaleOrPIVA')}
                      />
                    </div>

                    {/* Submit */}
                    <div className="pt-6 border-t">
                      <Button type="submit" disabled={saving} className="w-full md:w-auto">
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isNew ? 'Creazione...' : 'Salvataggio...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isNew ? 'Crea Cliente' : 'Salva Modifiche'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Informazioni Aggiuntive */}
              {!isNew && client && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informazioni</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Creato:</span>
                        <p className="text-gray-900">{formatDate(client.createdAt)}</p>
                      </div>
                      {client.updatedAt && (
                        <div>
                          <span className="text-gray-600">Aggiornato:</span>
                          <p className="text-gray-900">{formatDate(client.updatedAt)}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">ID Cliente:</span>
                        <p className="text-gray-900 font-mono text-xs">{client.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progetti Associati */}
              {!isNew && projects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Progetti ({projects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                        >
                          <div>
                            <p className="font-medium text-sm">{project.nome}</p>
                            <p className="text-xs text-gray-600">{project.status}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/progetti/${project.id}`)}
                          >
                            Apri
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Validazioni in tempo reale */}
              <Card>
                <CardHeader>
                  <CardTitle>Validazione</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      {watchEmail && validateEmail(watchEmail) ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      <span className={watchEmail && validateEmail(watchEmail) ? 'text-green-600' : 'text-gray-600'}>
                        Email valida
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      {watchCodiceFiscale && validateCodiceFiscaleOrPIVA(watchCodiceFiscale) ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      <span className={watchCodiceFiscale && validateCodiceFiscaleOrPIVA(watchCodiceFiscale) ? 'text-green-600' : 'text-gray-600'}>
                        Codice Fiscale/P.IVA valido
                      </span>
                    </div>
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