'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmailTemplate, EmailLog } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Mail,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  FileText,
  Settings
} from 'lucide-react';

export default function EmailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulando dados para demonstração
      // Em produção, estes dados viriam de serviços reais
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          nome: 'Projeto Criado',
          oggetto: 'Nuovo progetto creato: {{projectName}}',
          corpo: 'Ciao {{clientName}},\n\nIl tuo progetto "{{projectName}}" è stato creato con successo.\n\nPuoi compilare il briefing al seguente link:\n{{briefingLink}}\n\nGrazie!',
          tipo: 'progetto_creato',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          nome: 'Briefing Ricevuto',
          oggetto: 'Briefing ricevuto per {{projectName}}',
          corpo: 'Ciao,\n\nAbbiamo ricevuto il briefing per il progetto "{{projectName}}".\n\nLo esamineremo e ti contatteremo presto.\n\nGrazie!',
          tipo: 'briefing_ricevuto',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16')
        },
        {
          id: '3',
          nome: 'Status Cambiato',
          oggetto: 'Aggiornamento progetto: {{projectName}}',
          corpo: 'Ciao {{clientName}},\n\nLo status del tuo progetto "{{projectName}}" è cambiato a: {{newStatus}}.\n\n{{statusMessage}}\n\nGrazie!',
          tipo: 'status_cambiato',
          createdAt: new Date('2024-01-17'),
          updatedAt: new Date('2024-01-17')
        }
      ];

      const mockEmailLogs: EmailLog[] = [
        {
          id: '1',
          projectId: 'proj1',
          clientId: 'client1',
          destinatario: 'mario.rossi@example.com',
          oggetto: 'Nuovo progetto creato: Sito Web Aziendale',
          corpo: 'Ciao Mario,\n\nIl tuo progetto "Sito Web Aziendale" è stato creato...',
          status: 'inviato',
          createdAt: new Date('2024-01-20T10:30:00')
        },
        {
          id: '2',
          projectId: 'proj2',
          clientId: 'client2',
          destinatario: 'giulia.bianchi@example.com',
          oggetto: 'Briefing ricevuto per E-commerce',
          corpo: 'Ciao Giulia,\n\nAbbiamo ricevuto il briefing per il progetto "E-commerce"...',
          status: 'inviato',
          createdAt: new Date('2024-01-21T14:15:00')
        },
        {
          id: '3',
          projectId: 'proj3',
          clientId: 'client3',
          destinatario: 'luca.verdi@example.com',
          oggetto: 'Aggiornamento progetto: App Mobile',
          corpo: 'Ciao Luca,\n\nLo status del tuo progetto "App Mobile" è cambiato...',
          status: 'fallito',
          errorMessage: 'Indirizzo email non valido',
          createdAt: new Date('2024-01-22T09:45:00')
        },
        {
          id: '4',
          projectId: 'proj4',
          clientId: 'client4',
          destinatario: 'anna.neri@example.com',
          oggetto: 'Nuovo progetto creato: Sistema Gestionale',
          corpo: 'Ciao Anna,\n\nIl tuo progetto "Sistema Gestionale" è stato creato...',
          status: 'in_attesa',
          createdAt: new Date('2024-01-23T16:20:00')
        }
      ];

      setTemplates(mockTemplates);
      setEmailLogs(mockEmailLogs);
    } catch (err) {
      console.error('Errore nel caricamento dati email:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.oggetto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmailLogs = emailLogs.filter(log => {
    const matchesSearch = 
      log.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.oggetto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, errorMessage?: string) => {
    switch (status) {
      case 'inviato':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Inviato
          </span>
        );
      case 'fallito':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={errorMessage}>
            <XCircle className="w-3 h-3 mr-1" />
            Fallito
          </span>
        );
      case 'in_attesa':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            In Attesa
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

  const getTemplateTypeBadge = (tipo: string) => {
    const typeLabels = {
      'progetto_creato': 'Progetto Creato',
      'briefing_ricevuto': 'Briefing Ricevuto',
      'status_cambiato': 'Status Cambiato',
      'personalizzato': 'Personalizzato'
    };

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {typeLabels[tipo as keyof typeof typeLabels] || tipo}
      </span>
    );
  };

  const handleConfigurazioni = () => {
    setShowConfigModal(true);
  };

  const handleNuovoTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateModal(true);
  };

  const handleModificaTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleAnteprimaTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleVisualizzaEmail = (emailLog: EmailLog) => {
    setSelectedEmailLog(emailLog);
    setShowPreviewModal(true);
  };

  const handleSaveTemplate = (templateData: Partial<EmailTemplate>) => {
    if (editingTemplate) {
      // Modifica template esistente
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...templateData, updatedAt: new Date() }
          : t
      ));
    } else {
      // Crea nuovo template
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        nome: templateData.nome || '',
        oggetto: templateData.oggetto || '',
        corpo: templateData.corpo || '',
        tipo: templateData.tipo || 'personalizzato',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
    setShowTemplateModal(false);
    setEditingTemplate(null);
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
              <h1 className="text-2xl font-bold text-gray-900">Gestione Email</h1>
              <p className="text-gray-600">Gestisci template e monitora l'invio delle email</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                onClick={handleConfigurazioni}
              >
                <Settings className="h-4 w-4" />
                <span>Configurazioni</span>
              </Button>
              <Button 
                className="bg-primary-gradient flex items-center space-x-2"
                onClick={handleNuovoTemplate}
              >
                <Plus className="h-4 w-4" />
                <span>Nuovo Template</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Template Email ({filteredTemplates.length})
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Mail className="h-4 w-4 inline mr-2" />
                Log Email ({filteredEmailLogs.length})
              </button>
            </nav>
          </div>

          {/* Filtri */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={activeTab === 'templates' ? 'Cerca template...' : 'Cerca email...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {activeTab === 'logs' && (
                  <div className="sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">Tutti gli stati</option>
                      <option value="inviato">Inviato</option>
                      <option value="fallito">Fallito</option>
                      <option value="in_attesa">In Attesa</option>
                    </select>
                  </div>
                )}

          {/* Modal Configurazioni */}
          {showConfigModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Configurazioni Email</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Server SMTP
                    </label>
                    <Input placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porta
                    </label>
                    <Input placeholder="587" type="number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email mittente
                    </label>
                    <Input placeholder="noreply@gestifrella.com" type="email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <Input placeholder="••••••••" type="password" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfigModal(false)}
                  >
                    Annulla
                  </Button>
                  <Button onClick={() => setShowConfigModal(false)}>
                    Salva
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Template */}
          {showTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">
                  {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
                </h3>
                <TemplateForm 
                  template={editingTemplate}
                  onSave={handleSaveTemplate}
                  onCancel={() => setShowTemplateModal(false)}
                />
              </div>
            </div>
          )}

          {/* Modal Preview */}
          {showPreviewModal && (selectedTemplate || selectedEmailLog) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">
                  {selectedTemplate ? 'Anteprima Template' : 'Visualizza Email'}
                </h3>
                <PreviewContent 
                  template={selectedTemplate}
                  emailLog={selectedEmailLog}
                  onClose={() => {
                    setShowPreviewModal(false);
                    setSelectedTemplate(null);
                    setSelectedEmailLog(null);
                  }}
                />
              </div>
            </div>
          )}
              </div>
            </CardContent>
          </Card>

          {/* Contenuto */}
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

          {/* Template Tab */}
          {!error && activeTab === 'templates' && (
            <div className="space-y-4">
              {filteredTemplates.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'Nessun template trovato' : 'Nessun template disponibile'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Prova a modificare i filtri di ricerca' : 'Crea il tuo primo template email'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.nome}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.oggetto}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getTemplateTypeBadge(template.tipo)}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleModificaTemplate(template)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAnteprimaTemplate(template)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Anteprima
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        <p className="line-clamp-3">{template.corpo}</p>
                        <div className="mt-4 flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Creato: {formatDate(template.createdAt)}
                          {template.updatedAt.getTime() !== template.createdAt.getTime() && (
                            <span className="ml-4">
                              Modificato: {formatDate(template.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Logs Tab */}
          {!error && activeTab === 'logs' && (
            <div className="space-y-4">
              {filteredEmailLogs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || statusFilter !== 'all' ? 'Nessuna email trovata' : 'Nessuna email inviata'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Prova a modificare i filtri di ricerca'
                          : 'Le email inviate appariranno qui'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredEmailLogs.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{log.oggetto}</CardTitle>
                          <CardDescription className="mt-1">
                            Destinatario: {log.destinatario}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(log.status, log.errorMessage)}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVisualizzaEmail(log)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizza
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        <p className="line-clamp-2">{log.corpo}</p>
                        {log.errorMessage && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                            <strong>Errore:</strong> {log.errorMessage}
                          </div>
                        )}
                        <div className="mt-4 flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(log.createdAt)}
                          {log.projectId && (
                            <span className="ml-4">
                              <FileText className="h-3 w-3 mr-1 inline" />
                              Progetto: {log.projectId}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Componente per il form del template
function TemplateForm({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nome: template?.nome || '',
    oggetto: template?.oggetto || '',
    corpo: template?.corpo || '',
    tipo: template?.tipo || 'personalizzato'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome Template
        </label>
        <Input
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Es: Benvenuto Cliente"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Oggetto Email
        </label>
        <Input
          value={formData.oggetto}
          onChange={(e) => setFormData(prev => ({ ...prev, oggetto: e.target.value }))}
          placeholder="Es: Benvenuto {{clientName}}!"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo Template
        </label>
        <select
          value={formData.tipo}
          onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="personalizzato">Personalizzato</option>
          <option value="progetto_creato">Progetto Creato</option>
          <option value="briefing_ricevuto">Briefing Ricevuto</option>
          <option value="status_cambiato">Status Cambiato</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Corpo Email
        </label>
        <textarea
          value={formData.corpo}
          onChange={(e) => setFormData(prev => ({ ...prev, corpo: e.target.value }))}
          placeholder="Scrivi il contenuto dell'email...\n\nPuoi usare variabili come:\n{{clientName}} - Nome del cliente\n{{projectName}} - Nome del progetto\n{{briefingLink}} - Link al briefing"
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Variabili disponibili:</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <div><code>{'{{clientName}}'}</code> - Nome del cliente</div>
          <div><code>{'{{projectName}}'}</code> - Nome del progetto</div>
          <div><code>{'{{briefingLink}}'}</code> - Link al briefing</div>
          <div><code>{'{{newStatus}}'}</code> - Nuovo status (per template status_cambiato)</div>
          <div><code>{'{{statusMessage}}'}</code> - Messaggio di status</div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit">
          {template ? 'Salva Modifiche' : 'Crea Template'}
        </Button>
      </div>
    </form>
  );
}

// Componente per l'anteprima
function PreviewContent({ 
  template, 
  emailLog, 
  onClose 
}: { 
  template: EmailTemplate | null;
  emailLog: EmailLog | null;
  onClose: () => void;
}) {
  const content = template || emailLog;
  if (!content) return null;

  const sampleData = {
    clientName: 'Mario Rossi',
    projectName: 'Sito Web Aziendale',
    briefingLink: 'https://gestifrella.com/briefing/123',
    newStatus: 'In Sviluppo',
    statusMessage: 'Il progetto è ora in fase di sviluppo.'
  };

  const processTemplate = (text: string) => {
    return text.replace(/{{(\w+)}}/g, (match, key) => {
      return sampleData[key as keyof typeof sampleData] || match;
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h4 className="font-medium text-gray-900">Oggetto:</h4>
        <p className="text-gray-700 mt-1">
          {template ? processTemplate(template.oggetto) : emailLog?.oggetto}
        </p>
      </div>
      
      {emailLog && (
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-900">Destinatario:</h4>
          <p className="text-gray-700 mt-1">{emailLog.destinatario}</p>
        </div>
      )}
      
      <div>
        <h4 className="font-medium text-gray-900">Contenuto:</h4>
        <div className="mt-2 p-4 bg-gray-50 rounded-md border">
          <div className="whitespace-pre-wrap text-sm text-gray-700">
            {template ? processTemplate(template.corpo) : emailLog?.corpo}
          </div>
        </div>
      </div>
      
      {template && (
        <div className="bg-yellow-50 p-3 rounded-md">
          <p className="text-xs text-yellow-700">
            <strong>Nota:</strong> Questa è un'anteprima con dati di esempio. 
            I valori reali verranno sostituiti automaticamente quando l'email viene inviata.
          </p>
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <Button onClick={onClose}>
          Chiudi
        </Button>
      </div>
    </div>
  );
}