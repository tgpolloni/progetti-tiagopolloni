import { supabase } from '@/lib/supabase';
import { Project, Client } from '@/types';
import { generateBriefingURL } from '@/lib/utils';

export const projectService = {
  // Criar novo projeto
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'briefingURL'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          cliente_id: projectData.clientId,
          nome_progetto: projectData.nome,
          tipo_progetto: 'Web', // Default value, can be updated later
          descrizione: projectData.descrizione,
          stato: projectData.status,
          briefing_completed: projectData.briefingCompleted,
          briefing_url: '',
          note_interne: projectData.internalNotes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Atualizar com a URL do briefing
      const briefingURL = generateBriefingURL(data.id as string);
      const { error: updateError } = await supabase
        .from('projects')
        .update({ briefing_url: briefingURL })
        .eq('id', data.id as string);
      
      if (updateError) throw updateError;
      
      return data.id as string;
    } catch (error) {
      console.error('Errore nella creazione del progetto:', error);
      throw error;
    }
  },

  // Obter todos os projetos
  async getAllProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(project => ({
        id: project.id as string,
        clientId: project.cliente_id as string,
        nome: project.nome_progetto as string,
        descrizione: project.descrizione as string,
        status: project.stato as string,
        briefingCompleted: project.briefing_completed as boolean,
        briefingURL: project.briefing_url as string,
        internalNotes: project.note_interne as string,
        createdAt: new Date(project.created_at as string),
        updatedAt: new Date(project.updated_at as string)
      })) as Project[];
    } catch (error) {
      console.error('Errore nel recupero dei progetti:', error);
      throw error;
    }
  },

  // Obter projeto por ID
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return {
        id: data.id,
        clientId: data.cliente_id,
        nome: data.nome_progetto,
        descrizione: data.descrizione,
        status: data.stato,
        briefingCompleted: data.briefing_completed,
        briefingURL: data.briefing_url,
        internalNotes: data.note_interne,
        createdAt: new Date(data.created_at as string),
        updatedAt: new Date(data.updated_at as string)
      } as Project;
    } catch (error) {
      console.error('Errore nel recupero del progetto:', error);
      throw error;
    }
  },

  // Atualizar projeto
  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.clientId) updateData.cliente_id = updates.clientId;
      if (updates.nome) updateData.nome_progetto = updates.nome;
      if (updates.descrizione !== undefined) updateData.descrizione = updates.descrizione;
      if (updates.status) updateData.stato = updates.status;
      if (updates.briefingCompleted !== undefined) updateData.briefing_completed = updates.briefingCompleted;
      if (updates.briefingURL) updateData.briefing_url = updates.briefingURL;
      if (updates.internalNotes !== undefined) updateData.note_interne = updates.internalNotes;
      
      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Errore nell\'aggiornamento del progetto:', error);
      throw error;
    }
  },

  // Deletar projeto
  async deleteProject(id: string): Promise<void> {
    try {
      // Best-effort: remover usuário temporário de auth vinculado ao projeto
      try {
        await fetch('/api/briefing/delete-temp-by-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: id })
        });
      } catch (_) {
        // ignora erro de limpeza; não deve bloquear a exclusão do projeto
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Errore nella cancellazione del progetto:', error);
      throw error;
    }
  },

  // Obter projetos por status
  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('stato', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(project => ({
        id: project.id as string,
        clientId: project.cliente_id as string,
        nome: project.nome_progetto as string,
        descrizione: project.descrizione as string,
        status: project.stato as string,
        briefingCompleted: project.briefing_completed as boolean,
        briefingURL: project.briefing_url as string,
        internalNotes: project.note_interne as string,
        createdAt: new Date(project.created_at as string),
        updatedAt: new Date(project.updated_at as string)
      })) as Project[];
    } catch (error) {
      console.error('Errore nel recupero dei progetti per status:', error);
      throw error;
    }
  },

  // Obter projetos por cliente
  async getProjectsByClient(clientId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(project => ({
        id: project.id as string,
        clientId: project.cliente_id as string,
        nome: project.nome_progetto as string,
        descrizione: project.descrizione as string,
        status: project.stato as string,
        briefingCompleted: project.briefing_completed as boolean,
        briefingURL: project.briefing_url as string,
        internalNotes: project.note_interne as string,
        createdAt: new Date(project.created_at as string),
        updatedAt: new Date(project.updated_at as string)
      })) as Project[];
    } catch (error) {
      console.error('Errore nel recupero dei progetti per cliente:', error);
      throw error;
    }
  },

  // Marcar briefing como completado
  async markBriefingCompleted(projectId: string): Promise<void> {
    try {
      await this.updateProject(projectId, {
        briefingCompleted: true,
        status: 'In corso'
      });
    } catch (error) {
      console.error('Errore nel marcare il briefing come completato:', error);
      throw error;
    }
  }
};