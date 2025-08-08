'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { Project, Client } from '@/types';
import { formatDateShort, getStatusColor, getStatusIcon } from '@/lib/utils';
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ProgettiPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, clientsData] = await Promise.all([
        projectService.getAllProjects(),
        clientService.getAllClients()
      ]);
      
      setProjects(projectsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Errore nel caricamento dei progetti:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Filtro per status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(project => {
        const client = clients.find(c => c.id === project.clientId);
        const clientName = client ? client.nomeCompleto.toLowerCase() : '';
        const projectName = project.nome.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return projectName.includes(search) || clientName.includes(search);
      });
    }

    setFilteredProjects(filtered);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nomeCompleto : 'Cliente sconosciuto';
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo progetto?')) {
      try {
        await projectService.deleteProject(projectId);
        await loadData();
      } catch (error) {
        console.error('Errore nell\'eliminazione del progetto:', error);
        alert('Errore nell\'eliminazione del progetto');
      }
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'In attesa di briefing', label: 'In attesa di briefing' },
    { value: 'In corso', label: 'In corso' },
    { value: 'Pausa', label: 'Pausa' },
    { value: 'Completato', label: 'Completato' }
  ];

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Progetti</h1>
              <p className="text-gray-600">Gestisci tutti i tuoi progetti</p>
            </div>
            <Link href="/dashboard/progetti/nuovo">
              <Button className="bg-primary-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Progetto
              </Button>
            </Link>
          </div>

          {/* Filtri */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cerca per nome progetto o cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-64">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista Progetti */}
          <Card>
            <CardHeader>
              <CardTitle>Progetti ({filteredProjects.length})</CardTitle>
              <CardDescription>
                {statusFilter === 'all' 
                  ? 'Tutti i progetti' 
                  : `Progetti con stato: ${statusFilter}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Nessun progetto trovato con i filtri applicati' 
                      : 'Nessun progetto ancora'
                    }
                  </div>
                  {!searchTerm && statusFilter === 'all' && (
                    <Link href="/dashboard/progetti/nuovo">
                      <Button className="bg-primary-gradient">
                        Crea il tuo primo progetto
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg">{getStatusIcon(project.status)}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{project.nome}</h3>
                              <p className="text-sm text-gray-600">
                                Cliente: {getClientName(project.clientId)}
                              </p>
                            </div>
                          </div>
                          
                          {project.descrizione && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {project.descrizione}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Creato: {formatDateShort(project.createdAt)}</span>
                            <span>Aggiornato: {formatDateShort(project.updatedAt)}</span>
                            <span className={`status-badge ${getStatusColor(project.status).replace('bg-', 'status-').replace('text-', '').split(' ')[0]}`}>
                              {project.status}
                            </span>
                            {project.briefingCompleted && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                Briefing completato
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/dashboard/progetti/${project.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/progetti/${project.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}