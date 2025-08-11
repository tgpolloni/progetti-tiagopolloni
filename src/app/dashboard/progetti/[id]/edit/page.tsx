'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const schema = yup.object({
  nome: yup.string().required('Nome del progetto richiesto'),
  descrizione: yup.string().optional(),
  clientId: yup.string().required('Cliente richiesto'),
  status: yup.string().oneOf(['In attesa di briefing', 'In corso', 'Pausa', 'Completato']).required('Status richiesto'),
  internalNotes: yup.string().optional()
});

type ProjectFormData = yup.InferType<typeof schema>;

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ProjectFormData>();

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Carica progetto e clienti in parallelo
      const [projectData, clientsData] = await Promise.all([
        projectService.getProjectById(projectId),
        clientService.getAllClients()
      ]);
      
      if (!projectData) {
        setError('Progetto non trovato');
        return;
      }
      
      setProject(projectData);
      setClients(clientsData);
      
      // Popola il form con i dati del progetto
      reset({
        nome: projectData.nome,
        descrizione: projectData.descrizione || '',
        clientId: projectData.clientId,
        status: projectData.status,
        internalNotes: projectData.internalNotes || ''
      });
      
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!project) return;
    
    try {
      setSaving(true);
      setError('');
      
      const updatedProject: Partial<Project> = {
        nome: data.nome,
        descrizione: data.descrizione,
        clientId: data.clientId,
        status: data.status,
        internalNotes: data.internalNotes,
        updatedAt: new Date()
      };
      
      await projectService.updateProject(project.id, updatedProject);
      
      // Reindirizza alla pagina del progetto
      router.push(`/dashboard/progetti/${project.id}`);
      
    } catch (error) {
      console.error('Errore nell\'aggiornamento del progetto:', error);
      setError('Errore nell\'aggiornamento del progetto');
    } finally {
      setSaving(false);
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

  if (error && !project) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
            <p className="text-gray-600 mb-4">{error}</p>
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
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/progetti/${projectId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifica Progetto</h1>
              <p className="text-gray-600">{project?.nome}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Errore</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form principale */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dettagli del Progetto</CardTitle>
                  <CardDescription>
                    Modifica le informazioni del progetto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Nome progetto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Progetto *
                      </label>
                      <Input
                        {...register('nome')}
                        placeholder="Es. Sito web aziendale"
                        className={errors.nome ? 'border-red-300' : ''}
                      />
                      {errors.nome && (
                        <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                      )}
                    </div>

                    {/* Descrizione */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrizione
                      </label>
                      <textarea
                        {...register('descrizione')}
                        rows={3}
                        placeholder="Descrizione del progetto..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Cliente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente *
                      </label>
                      <select
                        {...register('clientId')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.clientId ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seleziona un cliente</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.nomeCompleto} - {client.nomeAzienda || 'Privato'}
                          </option>
                        ))}
                      </select>
                      {errors.clientId && (
                        <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        {...register('status')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.status ? 'border-red-300' : 'border-gray-300'
                        }`}
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

                    {/* Note interne */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Note Interne
                      </label>
                      <textarea
                        {...register('internalNotes')}
                        rows={4}
                        placeholder="Note private per uso interno..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Pulsanti */}
                    <div className="flex justify-end space-x-3 pt-6">
                      <Link href={`/dashboard/progetti/${projectId}`}>
                        <Button type="button" variant="outline">
                          Annulla
                        </Button>
                      </Link>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salva Modifiche
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar informazioni */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Progetto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID Progetto</p>
                    <p className="text-sm text-gray-900 font-mono">{project?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Creato il</p>
                    <p className="text-sm text-gray-900">
                      {project?.createdAt ? new Date(project.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ultima modifica</p>
                    <p className="text-sm text-gray-900">
                      {project?.updatedAt ? new Date(project.updatedAt).toLocaleDateString('it-IT') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Briefing completato</p>
                    <p className="text-sm text-gray-900">
                      {project?.briefingCompleted ? 'Sì' : 'No'}
                    </p>
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