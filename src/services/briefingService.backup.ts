// Backup del briefingService originale
import { supabase } from '@/lib/supabase';
import { BriefingFormData } from '@/types';

export const briefingService = {
  // Versione semplificata che usa solo le colonne esistenti
  async createBriefing(briefingData: Omit<BriefingFormData, 'id' | 'createdAt'>, projectId?: string, clientId?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('briefings')
        .insert({
          nome_completo: briefingData.nomeCompleto,
          email: briefingData.email,
          telefono: briefingData.telefono,
          nome_azienda: briefingData.nomeAzienda,
          tipo_progetto: briefingData.tipoProgetto,
          descrizione_progetto: briefingData.funzionalitaNecessarie || briefingData.obiettivoProgetto,
          obiettivi: briefingData.obiettivoProgetto,
          target_audience: briefingData.ambito,
          budget: briefingData.budgetStimato,
          timeline: briefingData.scadenzaFinale,
          riferimenti: briefingData.sitiRiferimento,
          note_aggiuntive: briefingData.informazioniAggiuntive,
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Errore nella creazione del briefing:', error);
      throw new Error('Errore nella creazione del briefing: ' + (error as Error).message);
    }
  },

  async getBriefingById(id: string): Promise<BriefingFormData | null> {
    try {
      const { data, error } = await supabase
        .from('briefings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        nomeCompleto: data.nome_completo,
        email: data.email,
        telefono: data.telefono,
        nomeAzienda: data.nome_azienda,
        tipoProgetto: data.tipo_progetto,
        obiettivoProgetto: data.obiettivi,
        funzionalitaNecessarie: data.descrizione_progetto,
        budgetStimato: data.budget,
        scadenzaFinale: data.timeline,
        sitiRiferimento: data.riferimenti,
        informazioniAggiuntive: data.note_aggiuntive,
        createdAt: data.created_at
      } as BriefingFormData;
    } catch (error) {
      console.error('Errore nel recupero del briefing:', error);
      return null;
    }
  },

  async getAllBriefings(): Promise<BriefingFormData[]> {
    try {
      const { data, error } = await supabase
        .from('briefings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nomeCompleto: item.nome_completo,
        email: item.email,
        telefono: item.telefono,
        nomeAzienda: item.nome_azienda,
        tipoProgetto: item.tipo_progetto,
        obiettivoProgetto: item.obiettivi,
        funzionalitaNecessarie: item.descrizione_progetto,
        budgetStimato: item.budget,
        scadenzaFinale: item.timeline,
        sitiRiferimento: item.riferimenti,
        informazioniAggiuntive: item.note_aggiuntive,
        createdAt: item.created_at
      })) as BriefingFormData[];
    } catch (error) {
      console.error('Errore nel recupero dei briefings:', error);
      return [];
    }
  },

  async updateBriefingStatus(id: string, status: 'pending' | 'reviewed' | 'approved' | 'rejected'): Promise<void> {
    try {
      const { error } = await supabase
        .from('briefings')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello status del briefing:', error);
      throw error;
    }
  },

  async deleteBriefing(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('briefings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Errore nell\'eliminazione del briefing:', error);
      throw error;
    }
  }
};