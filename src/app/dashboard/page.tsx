'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { Project, Client } from '@/types';
import { formatDateShort, getStatusColor, getStatusIcon } from '@/lib/utils';
import { Plus, FolderOpen, Users, FileText, Clock } from 'lucide-react';
import Link from 'next/link';


export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    inProgress: 0,
    paused: 0,
    completed: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregamento com fallback para arrays vazios em caso de erro
      let projectsData: Project[] = [];
      let clientsData: Client[] = [];
      
      try {
        projectsData = await projectService.getAllProjects();
      } catch (error) {
        console.warn('Erro ao carregar projetos:', error);
        projectsData = [];
      }
      
      try {
        clientsData = await clientService.getAllClients();
      } catch (error) {
        console.warn('Erro ao carregar clientes:', error);
        clientsData = [];
      }
      
      setProjects(projectsData);
      setClients(clientsData);
      
      // Calcular estatísticas
      const stats = {
        total: projectsData.length,
        waiting: projectsData.filter(p => p.status === 'In attesa di briefing').length,
        inProgress: projectsData.filter(p => p.status === 'In corso').length,
        paused: projectsData.filter(p => p.status === 'Pausa').length,
        completed: projectsData.filter(p => p.status === 'Completato').length
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      // Garantir que os estados sejam definidos mesmo em caso de erro
      setProjects([]);
      setClients([]);
      setStats({
        total: 0,
        waiting: 0,
        inProgress: 0,
        paused: 0,
        completed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nomeCompleto : 'Cliente sconosciuto';
  };

  const recentProjects = projects.slice(0, 5);

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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Panoramica dei tuoi progetti freelancer</p>
            </div>
            <Link href="/dashboard/progetti/nuovo">
              <Button className="bg-primary-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Progetto
              </Button>
            </Link>
          </div>

          {/* Statistiche */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progetti Totali</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {clients.length} clienti registrati
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
                <p className="text-xs text-muted-foreground">
                  Aspettando briefing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Corso</CardTitle>
                <div className="h-4 w-4 bg-blue-600 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  Progetti attivi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completati</CardTitle>
                <div className="h-4 w-4 bg-green-600 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  Progetti finiti
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progetti Recenti */}
          <Card>
            <CardHeader>
              <CardTitle>Progetti Recenti</CardTitle>
              <CardDescription>
                Gli ultimi progetti creati
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nessun progetto ancora</p>
                  <Link href="/dashboard/progetti/nuovo">
                    <Button className="mt-4 bg-primary-gradient">
                      Crea il tuo primo progetto
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getStatusIcon(project.status)}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{project.nome}</h3>
                            <p className="text-sm text-gray-500">
                              Cliente: {getClientName(project.clientId)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`status-badge ${getStatusColor(project.status).replace('bg-', 'status-').replace('text-', '').split(' ')[0]}`}>
                          {project.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDateShort(project.createdAt)}
                        </span>
                        <Link href={`/dashboard/progetti/${project.id}`}>
                          <Button variant="outline" size="sm">
                            Visualizza
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {projects.length > 5 && (
                    <div className="text-center pt-4">
                      <Link href="/dashboard/progetti">
                        <Button variant="outline">
                          Visualizza tutti i progetti
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}