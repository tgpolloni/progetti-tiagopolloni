'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { briefingService } from '@/services/briefingService';
import { projectService } from '@/services/projectService';
import { BriefingFormData, Project } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Search,
  FileText,
  Eye,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react';

interface BriefingWithProject extends BriefingFormData {
  id: string;
  projectId?: string;
  projectName?: string;
  createdAt?: Date;
  status?: 'pending' | 'reviewed' | 'completed';
}

export default function BriefingPage() {
  const router = useRouter();
  const [briefings, setBriefings] = useState<BriefingWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [briefingsData, projectsData] = await Promise.all([
        briefingService.getAllBriefings(),
        projectService.getAllProjects()
      ]);
      
      // Combinar briefings com informações do projeto
      const briefingsWithProjects = briefingsData.map(briefing => {
        return {
          ...briefing,
          id: briefing.id || '',
          projectId: briefing.projectId || undefined,
          projectName: briefing.projectName || 'Briefing Público',
          createdAt: new Date(),
          status: 'pending' as const
        };
      });
      
      setBriefings(briefingsWithProjects);
      setProjects(projectsData);
    } catch (err) {
      console.error('Erro ao carregar briefings:', err);
      setError('Erro ao carregar briefings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBriefings = briefings.filter(briefing => {
    const matchesSearch = 
      briefing.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      briefing.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      briefing.nomeAzienda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      briefing.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || briefing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            In Attesa
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Eye className="w-3 h-3 mr-1" />
            Revisionato
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Sconosciuto
          </span>
        );
    }
  };

  const viewBriefingDetails = (briefing: BriefingWithProject) => {
    if (briefing.projectId && typeof briefing.projectId === 'string') {
      router.push(`/dashboard/progetti/${briefing.projectId}`);
    } else {
      // Sem projectId associado: abre um modal de detalhes rápido ou ignora
      alert('Este briefing não está associado a um projeto.');
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Briefings</h1>
              <p className="text-gray-600">Gestisci tutti i briefings ricevuti dai clienti</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {filteredBriefings.length} briefing{filteredBriefings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Filtri */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cerca per nome, email, azienda o progetto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Tutti gli stati</option>
                    <option value="pending">In Attesa</option>
                    <option value="reviewed">Revisionato</option>
                    <option value="completed">Completato</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista Briefings */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Errore</h3>
                  <p className="text-gray-600">{error}</p>
                  <Button onClick={loadData} className="mt-4">
                    Riprova
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!error && filteredBriefings.length === 0 && !loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'Nessun briefing trovato' : 'Nessun briefing ricevuto'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Prova a modificare i filtri di ricerca'
                      : 'I briefings compilati dai clienti appariranno qui'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!error && filteredBriefings.length > 0 && (
            <div className="grid gap-6">
              {filteredBriefings.map((briefing) => (
                <Card key={briefing.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {briefing.nomeCompleto}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Progetto: {briefing.projectName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(briefing.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewBriefingDetails(briefing)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizza
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Building className="h-4 w-4 mr-2" />
                        <span>{briefing.nomeAzienda || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{briefing.email}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{briefing.telefono || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{briefing.createdAt ? formatDate(briefing.createdAt) : 'N/A'}</span>
                      </div>
                    </div>
                    
                    {briefing.tipoProgetto && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start space-x-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Tipo: {briefing.tipoProgetto}
                            </p>
                            {briefing.obiettivoProgetto && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {briefing.obiettivoProgetto}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}