export interface Client {
  id: string;
  nomeCompleto: string;
  nomeAzienda?: string;
  codiceFiscaleOrPIVA: string;
  email: string;
  telefono: string;
  ruolo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  clientId: string;
  nome: string;
  descrizione?: string;
  status: 'In attesa di briefing' | 'In corso' | 'Pausa' | 'Completato';
  briefingCompleted: boolean;
  briefingURL: string;
  internalNotes?: string;
  files?: string[]; // URLs dos arquivos no Supabase Storage
  // Nuovi campi opzionali
  dataInizio?: Date;
  dataFinePrevista?: Date;
  budget?: number | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Briefing {
  id: string;
  projectId: string;
  clientId: string;
  
  // Informazioni sul Cliente
  nomeCompleto: string;
  nomeAzienda?: string;
  codiceFiscaleOrPIVA: string;
  email: string;
  telefono: string;
  ruolo: string;
  
  // Obiettivi del Progetto
  obiettivoProgetto: string;
  giaEsistente: string;
  scadenzaSpecifica?: string;
  
  // Tipo di Progetto
  tipoProgetto: 'Sito istituzionale' | 'E-commerce' | 'Sistema Web' | 'App Nativa (Android/iOS)' | 'Altro';
  tipoProgettoAltro?: string;
  ambito: 'Solo front-end' | 'Solo back-end' | 'Completo (front-end + back-end)';
  
  // Funzionalità Richieste
  funzionalitaNecessarie: string;
  funzionalitaPrincipali: string;
  funzionalitaSecondarie?: string;
  livelliUtenti?: string;
  areeRiservate?: string;
  
  // Design e UX
  designEsistente: 'Sì – file Figma/PSD' | 'No – serve creazione';
  sitiRiferimento?: string;
  paletteColori?: string;
  logoReady?: boolean;
  
  // Integrazioni e Tecnologie
  serviziEsterni?: string;
  piattaforme: string[]; // ['Web', 'Android', 'iOS']
  preferenzeTecniche?: string;
  
  // Contenuti e Dati
  contenutiPronti?: string;
  modalitaInvio?: string;
  importazioneAltroSistema?: string;
  
  // Hosting e Dominio
  haiDominio?: boolean;
  haiHosting?: boolean;
  serveAssistenza?: boolean;
  
  // Supporto e Manutenzione
  tipoSupporto: 'Supporto occasionale' | 'Manutenzione mensile' | 'Nessun supporto';
  
  // Budget e Pagamento
  budgetStimato?: string;
  modalitaPagamento: 'A fasi' | 'Prezzo fisso' | 'A ore';
  
  // Tempistiche
  scadenzaFinale?: string;
  partiUrgenti?: string;
  dataLancio?: string;
  
  // Note Finali
  informazioniAggiuntive?: string;
  restrizioniNormative?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  nome: string;
  oggetto: string;
  corpo: string;
  tipo: 'progetto_creato' | 'briefing_ricevuto' | 'status_cambiato' | 'personalizzato';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  projectId?: string;
  clientId?: string;
  destinatario: string;
  oggetto: string;
  corpo: string;
  status: 'inviato' | 'fallito' | 'in_attesa';
  errorMessage?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  tipo: 'briefing_ricevuto' | 'progetto_creato' | 'status_cambiato';
  titolo: string;
  messaggio: string;
  letta: boolean;
  projectId?: string;
  createdAt: Date;
}

export type ProjectStatus = Project['status'];
export interface BriefingFormData {
  id?: string;
  nomeCompleto: string;
  nomeAzienda?: string;
  codiceFiscaleOrPIVA: string;
  email: string;
  telefono: string;
  ruolo: string;
  
  // Obiettivi del Progetto
  obiettivoProgetto: string;
  giaEsistente: string;
  scadenzaSpecifica?: string;
  
  // Tipo di Progetto
  tipoProgetto: string;
  tipoProgettoAltro?: string;
  ambito: string;
  
  // Funzionalità Richieste
  funzionalitaNecessarie: string;
  funzionalitaPrincipali: string;
  funzionalitaSecondarie?: string;
  livelliUtenti?: string;
  areeRiservate?: string;
  
  // Design e UX
  designEsistente: string;
  sitiRiferimento?: string;
  paletteColori?: string;
  logoReady?: boolean;
  
  // Integrazioni e Tecnologie
  serviziEsterni?: string;
  piattaforme?: string[];
  preferenzeTecniche?: string;
  
  // Contenuti e Dati
  contenutiPronti?: string;
  modalitaInvio?: string;
  importazioneAltroSistema?: string;
  
  // Hosting e Dominio
  haiDominio?: boolean;
  haiHosting?: boolean;
  serveAssistenza?: boolean;
  
  // Supporto e Manutenzione
  tipoSupporto: string;
  
  // Budget e Pagamento
  budgetStimato?: string;
  modalitaPagamento?: string;
  
  // Tempistiche
  scadenzaFinale?: string;
  partiUrgenti?: string;
  dataLancio?: string;
  
  // Note Finali
  informazioniAggiuntive?: string;
  restrizioniNormative?: string;
  
  // Projeto associado
  projectId?: string;
  projectName?: string;
}