'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import { Client, Project } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Plus,
  User,
  Building,
  Mail,
  Phone,
  FileText,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, projectsData] = await Promise.all([
        clientService.getAllClients(),
        projectService.getAllProjects()
      ]);
      setClients(clientsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    // Verifica se il cliente ha progetti associati
    const clientProjects = projects.filter(p => p.clientId === clientId);
    
    if (clientProjects.length > 0) {
      alert(`Impossibile eliminare il cliente. Ha ${clientProjects.length} progetto/i associato/i.`);
      return;
    }
    
    if (!confirm('Sei sicuro di voler eliminare questo cliente?')) return;
    
    try {
      setDeleting(clientId);
      await clientService.deleteClient(clientId);
      setClients(clients.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Errore nell\'eliminazione del cliente:', error);
      setError('Errore nell\'eliminazione del cliente');
    } finally {
      setDeleting(null);
    }
  };

  const getClientProjects = (clientId: string) => {
    return projects.filter(p => p.clientId === clientId);
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.nomeCompleto.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      (client.nomeAzienda && client.nomeAzienda.toLowerCase().includes(searchLower)) ||
      (client.codiceFiscaleOrPIVA && client.codiceFiscaleOrPIVA.toLowerCase().includes(searchLower))
    );
  });

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
              <p className="text-gray-600">Gestisci i tuoi clienti</p>
            </div>
            <Button onClick={() => router.push('/dashboard/clienti/nuovo')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Cliente
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Filtri */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Cerca per nome, email, azienda o codice fiscale..."
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiche */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Totale Clienti</p>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aziende</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter(c => c.nomeAzienda).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Progetti Attivi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {projects.filter(p => p.status !== 'Completato').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista Clienti */}
          <div className="space-y-4">
            {filteredClients.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'Nessun cliente trovato' : 'Nessun cliente'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm 
                        ? 'Prova a modificare i criteri di ricerca'
                        : 'Inizia aggiungendo il tuo primo cliente'
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => router.push('/dashboard/clienti/nuovo')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Cliente
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredClients.map((client) => {
                const clientProjects = getClientProjects(client.id);
                const activeProjects = clientProjects.filter(p => p.status !== 'Completato');
                
                return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {client.nomeCompleto}
                                </h3>
                                {client.nomeAzienda && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Building className="h-3 w-3 mr-1" />
                                    {client.nomeAzienda}
                                  </span>
                                )}
                              </div>
                              
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{client.telefono}</span>
                                </div>
                                {client.codiceFiscaleOrPIVA && (
                                  <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{client.codiceFiscaleOrPIVA}</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <span className="text-gray-400 mr-2">Registrato:</span>
                                  <span>{formatDate(client.createdAt)}</span>
                                </div>
                              </div>
                              
                              {/* Progetti del cliente */}
                              <div className="mt-3">
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-gray-600">
                                    <strong>{clientProjects.length}</strong> progetto/i totali
                                  </span>
                                  {activeProjects.length > 0 && (
                                    <span className="text-green-600">
                                      <strong>{activeProjects.length}</strong> attivo/i
                                    </span>
                                  )}
                                </div>
                                
                                {clientProjects.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {clientProjects.slice(0, 3).map((project) => (
                                      <button
                                        key={project.id}
                                        onClick={() => router.push(`/dashboard/progetti/${project.id}`)}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                      >
                                        {project.nome}
                                      </button>
                                    ))}
                                    {clientProjects.length > 3 && (
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                                        +{clientProjects.length - 3} altri
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/clienti/${client.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            disabled={deleting === client.id || clientProjects.length > 0}
                          >
                            {deleting === client.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Paginazione (se necessaria in futuro) */}
          {filteredClients.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Mostrando <strong>{filteredClients.length}</strong> di <strong>{clients.length}</strong> clienti
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}