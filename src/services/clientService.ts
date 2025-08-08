import { supabase } from '@/lib/supabase';
import { Client } from '@/types';

const CLIENTS_COLLECTION = 'clients';

export const clientService = {
  // Criar novo cliente
  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          nome_completo: clientData.nomeCompleto,
          nome_azienda: clientData.nomeAzienda,
          codice_fiscale_or_piva: clientData.codiceFiscaleOrPIVA,
          email: clientData.email,
          telefono: clientData.telefono,
          ruolo: clientData.ruolo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        // Se já existe (violação de única), reutiliza o registro existente
        // Código 23505 = unique_violation
        if ((error as any).code === '23505') {
          // Tenta localizar por email primeiro, depois por codice fiscale/P.IVA
          const existingByEmail = await this.getClientByEmail(clientData.email).catch(() => null);
          if (existingByEmail?.id) return existingByEmail.id;

          const existingByCf = await this.getClientByCodice(clientData.codiceFiscaleOrPIVA).catch(() => null);
          if (existingByCf?.id) return existingByCf.id;
        }
        throw error;
      }
      return data.id;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  // Obter todos os clientes
  async getAllClients(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nome_completo', { ascending: true });
      
      if (error) throw error;
      
      return data.map(client => ({
        id: client.id,
        nomeCompleto: client.nome_completo,
        nomeAzienda: client.nome_azienda,
        codiceFiscaleOrPIVA: client.codice_fiscale_or_piva,
        email: client.email,
        telefono: client.telefono,
        ruolo: client.ruolo,
        createdAt: new Date(client.created_at),
        updatedAt: client.updated_at ? new Date(client.updated_at) : undefined
      })) as Client[];
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  },

  // Obter cliente por ID
  async getClientById(id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
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
        nomeAzienda: data.nome_azienda,
        codiceFiscaleOrPIVA: data.codice_fiscale_or_piva,
        email: data.email,
        telefono: data.telefono,
        ruolo: data.ruolo,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      } as Client;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
  },

  // Obter cliente por email
  async getClientByEmail(email: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;

      return {
        id: data.id,
        nomeCompleto: data.nome_completo,
        nomeAzienda: data.nome_azienda,
        codiceFiscaleOrPIVA: data.codice_fiscale_or_piva,
        email: data.email,
        telefono: data.telefono,
        ruolo: data.ruolo,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      } as Client;
    } catch (error) {
      console.error('Erro ao buscar cliente por email:', error);
      throw error;
    }
  },

  // Obter cliente por codice fiscale/P.IVA
  async getClientByCodice(codiceFiscaleOrPIVA: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('codice_fiscale_or_piva', codiceFiscaleOrPIVA)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        nomeCompleto: data.nome_completo,
        nomeAzienda: data.nome_azienda,
        codiceFiscaleOrPIVA: data.codice_fiscale_or_piva,
        email: data.email,
        telefono: data.telefono,
        ruolo: data.ruolo,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      } as Client;
    } catch (error) {
      console.error('Erro ao buscar cliente por codice fiscale/P.IVA:', error);
      throw error;
    }
  },

  // Atualizar cliente
  async updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.nomeCompleto) updateData.nome_completo = updates.nomeCompleto;
      if (updates.nomeAzienda !== undefined) updateData.nome_azienda = updates.nomeAzienda;
      if (updates.codiceFiscaleOrPIVA) updateData.codice_fiscale_or_piva = updates.codiceFiscaleOrPIVA;
      if (updates.email) updateData.email = updates.email;
      if (updates.telefono) updateData.telefono = updates.telefono;
      if (updates.ruolo !== undefined) updateData.ruolo = updates.ruolo;
      
      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  // Deletar cliente
  async deleteClient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  },

  // Buscar clientes por nome
  async searchClientsByName(searchTerm: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`nome_completo.ilike.%${searchTerm}%,nome_azienda.ilike.%${searchTerm}%`)
        .order('nome_completo', { ascending: true });
      
      if (error) throw error;
      
      return data.map(client => ({
        id: client.id,
        nomeCompleto: client.nome_completo,
        nomeAzienda: client.nome_azienda,
        codiceFiscaleOrPIVA: client.codice_fiscale_or_piva,
        email: client.email,
        telefono: client.telefono,
        ruolo: client.ruolo,
        createdAt: new Date(client.created_at),
        updatedAt: client.updated_at ? new Date(client.updated_at) : undefined
      })) as Client[];
    } catch (error) {
      console.error('Erro na busca de clientes:', error);
      throw error;
    }
  },

  // Verificar se cliente existe por código fiscal/P.IVA
  async checkClientExists(codiceFiscaleOrPIVA: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('codice_fiscale_or_piva', codiceFiscaleOrPIVA)
        .limit(1);
      
      if (error) throw error;
      
      return data.length > 0;
    } catch (error) {
      console.error('Erro na verificação da existência do cliente:', error);
      throw error;
    }
  }
};