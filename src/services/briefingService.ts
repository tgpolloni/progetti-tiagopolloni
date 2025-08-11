import { supabase } from '@/lib/supabase';
import { BriefingFormData } from '@/types';

export const briefingService = {
  // Salvar novo briefing
  async createBriefing(briefingData: Omit<BriefingFormData, 'id' | 'createdAt'>, projectId?: string, clientId?: string): Promise<string> {
    try {
      // VERSIONE TEMPORANEA: usa solo le colonne esistenti nella tabella briefings
      // Dopo aver eseguito fix_briefings_table.sql, ripristina la versione completa
      const { data, error } = await supabase
        .from('briefings')
        .insert({
          nome_completo: briefingData.nomeCompleto,
          email: briefingData.email,
          telefono: briefingData.telefono,
          nome_azienda: briefingData.nomeAzienda,
          tipo_progetto: briefingData.tipoProgetto,
          descrizione_progetto: briefingData.funzionalitaNecessarie || briefingData.obiettivoProgetto || 'Briefing compilato tramite form',
          obiettivi: briefingData.obiettivoProgetto,
          target_audience: briefingData.ambito,
          budget: briefingData.budgetStimato,
          timeline: briefingData.scadenzaFinale,
          riferimenti: briefingData.sitiRiferimento,
          project_id: projectId,
          client_id: clientId,
          note_aggiuntive: JSON.stringify({
            codiceFiscaleOrPIVA: briefingData.codiceFiscaleOrPIVA,
            ruolo: briefingData.ruolo,
            giaEsistente: briefingData.giaEsistente,
            tipoProgettoAltro: briefingData.tipoProgettoAltro,
            funzionalitaPrincipali: briefingData.funzionalitaPrincipali,
            funzionalitaSecondarie: briefingData.funzionalitaSecondarie,
            designEsistente: briefingData.designEsistente,
            paletteColori: briefingData.paletteColori,
            logoReady: briefingData.logoReady,
            serviziEsterni: briefingData.serviziEsterni,
            piattaforme: briefingData.piattaforme,
            preferenzeTecniche: briefingData.preferenzeTecniche,
            contenutiPronti: briefingData.contenutiPronti,
            modalitaInvio: briefingData.modalitaInvio,
            haiDominio: briefingData.haiDominio,
            haiHosting: briefingData.haiHosting,
            serveAssistenza: briefingData.serveAssistenza,
            tipoSupporto: briefingData.tipoSupporto,
            modalitaPagamento: briefingData.modalitaPagamento,
            partiUrgenti: briefingData.partiUrgenti,
            dataLancio: briefingData.dataLancio,
            informazioniAggiuntive: briefingData.informazioniAggiuntive,
            restrizioniNormative: briefingData.restrizioniNormative
          }),
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return (data as { id: string }).id;
    } catch (error) {
      console.error('Errore nella creazione del briefing:', error);
      throw error;
    }
  },

  // Buscar briefing por projectId
  async getBriefingByProjectId(projectId: string): Promise<BriefingFormData | null> {
    try {
      const { data, error } = await supabase
        .from('briefings')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        nomeCompleto: data.nome_completo,
        email: data.email,
        telefono: data.telefono,
        nomeAzienda: data.nome_azienda,
        codiceFiscaleOrPIVA: data.codice_fiscale_or_piva || '',
        ruolo: data.ruolo || '',
        obiettivoProgetto: data.obiettivi || '',
        giaEsistente: data.gia_esistente || '',
        scadenzaSpecifica: data.scadenza_specifica,
        tipoProgetto: data.tipo_progetto,
        tipoProgettoAltro: data.tipo_progetto_altro,
        ambito: data.ambito || 'Completo (front-end + back-end)',
        funzionalitaNecessarie: data.funzionalita_necessarie || '',
        funzionalitaPrincipali: data.funzionalita_principali || '',
        funzionalitaSecondarie: data.funzionalita_secondarie,
        livelliUtenti: data.livelli_utenti,
        areeRiservate: data.aree_riservate,
        designEsistente: data.design_esistente || 'No – serve creazione',
        sitiRiferimento: data.siti_riferimento,
        paletteColori: data.palette_colori,
        logoReady: data.logo_ready || false,
        serviziEsterni: data.servizi_esterni,
        piattaforme: data.piattaforme || [],
        preferenzeTecniche: data.preferenze_tecniche,
        contenutiPronti: data.contenuti_pronti,
        modalitaInvio: data.modalita_invio,
        importazioneAltroSistema: data.importazione_altro_sistema,
        haiDominio: data.hai_dominio || false,
        haiHosting: data.hai_hosting || false,
        serveAssistenza: data.serve_assistenza || false,
        tipoSupporto: data.tipo_supporto || 'Nessun supporto',
        budgetStimato: data.budget_stimato,
        modalitaPagamento: data.modalita_pagamento || 'A fasi',
        scadenzaFinale: data.scadenza_finale,
        partiUrgenti: data.parti_urgenti,
        dataLancio: data.data_lancio,
        informazioniAggiuntive: data.informazioni_aggiuntive,
        restrizioniNormative: data.restrizioni_normative
      } as BriefingFormData;
    } catch (error) {
      console.error('Erro ao buscar briefing por projectId:', error);
      throw error;
    }
  },

  // Buscar briefing por ID
  async getBriefingById(id: string): Promise<BriefingFormData | null> {
    try {
      const { data, error } = await supabase
        .from('briefings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return {
        id: data.id,
        nomeCompleto: data.nome_completo,
        email: data.email,
        telefono: data.telefono,
        nomeAzienda: data.nome_azienda,
        codiceFiscaleOrPIVA: data.codice_fiscale_or_piva || '',
        ruolo: data.ruolo || '',
        obiettivoProgetto: data.obiettivi || '',
        giaEsistente: data.gia_esistente || '',
        scadenzaSpecifica: data.scadenza_specifica,
        tipoProgetto: data.tipo_progetto,
        tipoProgettoAltro: data.tipo_progetto_altro,
        ambito: data.ambito || 'Completo (front-end + back-end)',
        funzionalitaNecessarie: data.funzionalita_necessarie || '',
        funzionalitaPrincipali: data.funzionalita_principali || '',
        funzionalitaSecondarie: data.funzionalita_secondarie,
        livelliUtenti: data.livelli_utenti,
        areeRiservate: data.aree_riservate,
        designEsistente: data.design_esistente || 'No – serve creazione',
        sitiRiferimento: data.siti_riferimento,
        paletteColori: data.palette_colori,
        logoReady: data.logo_ready || false,
        serviziEsterni: data.servizi_esterni,
        piattaforme: data.piattaforme || [],
        preferenzeTecniche: data.preferenze_tecniche,
        contenutiPronti: data.contenuti_pronti,
        modalitaInvio: data.modalita_invio,
        importazioneAltroSistema: data.importazione_altro_sistema,
        haiDominio: data.hai_dominio || false,
        haiHosting: data.hai_hosting || false,
        serveAssistenza: data.serve_assistenza || false,
        tipoSupporto: data.tipo_supporto || 'Nessun supporto',
        budgetStimato: data.budget_stimato,
        modalitaPagamento: data.modalita_pagamento || 'A fasi',
        scadenzaFinale: data.scadenza_finale,
        partiUrgenti: data.parti_urgenti,
        dataLancio: data.data_lancio,
        informazioniAggiuntive: data.informazioni_aggiuntive,
        restrizioniNormative: data.restrizioni_normative
      } as BriefingFormData;
    } catch (error) {
      console.error('Erro ao buscar briefing:', error);
      throw error;
    }
  },

  // Buscar todos os briefings
  async getAllBriefings(): Promise<BriefingFormData[]> {
    try {
      const { data, error } = await supabase
        .from('briefings')
        .select(`
          *,
          projects!inner(nome_progetto, id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(briefing => ({
        id: briefing.id as string,
        nomeCompleto: briefing.nome_completo as string,
        email: briefing.email as string,
        telefono: briefing.telefono as string,
        nomeAzienda: briefing.nome_azienda as string,
        codiceFiscaleOrPIVA: (briefing.codice_fiscale_or_piva || '') as string,
        ruolo: (briefing.ruolo || '') as string,
        obiettivoProgetto: (briefing.obiettivi || '') as string,
        giaEsistente: (briefing.gia_esistente || '') as string,
        scadenzaSpecifica: briefing.scadenza_specifica as string,
        tipoProgetto: briefing.tipo_progetto as string,
        tipoProgettoAltro: briefing.tipo_progetto_altro as string,
        ambito: (briefing.ambito || 'Completo (front-end + back-end)') as string,
        funzionalitaNecessarie: (briefing.funzionalita_necessarie || '') as string,
        funzionalitaPrincipali: (briefing.funzionalita_principali || '') as string,
        funzionalitaSecondarie: briefing.funzionalita_secondarie as string,
        livelliUtenti: briefing.livelli_utenti as string,
        areeRiservate: briefing.aree_riservate as string,
        designEsistente: (briefing.design_esistente || 'No – serve creazione') as string,
        sitiRiferimento: briefing.siti_riferimento as string,
        paletteColori: briefing.palette_colori as string,
        logoReady: (briefing.logo_ready || false) as boolean,
        serviziEsterni: briefing.servizi_esterni as string,
        piattaforme: (briefing.piattaforme || []) as string[],
        preferenzeTecniche: briefing.preferenze_tecniche as string,
        contenutiPronti: briefing.contenuti_pronti as string,
        modalitaInvio: briefing.modalita_invio as string,
        importazioneAltroSistema: briefing.importazione_altro_sistema as string,
        haiDominio: (briefing.hai_dominio || false) as boolean,
        haiHosting: (briefing.hai_hosting || false) as boolean,
        serveAssistenza: (briefing.serve_assistenza || false) as boolean,
        tipoSupporto: (briefing.tipo_supporto || 'Nessun supporto') as string,
        budgetStimato: briefing.budget_stimato as string,
        modalitaPagamento: (briefing.modalita_pagamento || 'A fasi') as string,
        scadenzaFinale: briefing.scadenza_finale as string,
        partiUrgenti: briefing.parti_urgenti as string,
        dataLancio: briefing.data_lancio as string,
        informazioniAggiuntive: briefing.informazioni_aggiuntive as string,
        restrizioniNormative: briefing.restrizioni_normative as string,
        projectId: briefing.project_id as string,
        clientId: briefing.client_id as string,
        projectName: ((briefing.projects as { nome_progetto?: string })?.nome_progetto || 'Briefing Público') as string
      })) as BriefingFormData[];
    } catch (error) {
      console.error('Erro ao buscar briefings:', error);
      throw error;
    }
  },

  // Atualizar status do briefing
  async updateBriefingStatus(id: string, status: 'pending' | 'reviewed' | 'approved' | 'rejected'): Promise<void> {
    try {
      const { error } = await supabase
        .from('briefings')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status do briefing:', error);
      throw error;
    }
  },

  // Deletar briefing
  async deleteBriefing(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('briefings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar briefing:', error);
      throw error;
    }
  }
};