import { Contract, Supplier, UserAccountItem, AuditLog, SystemSettings } from '../types';

const API_BASE_URL = (((import.meta as any).env?.VITE_API_URL as string) || '').replace(/\/$/, '');

/**
 * Standard HTTP Helper for Backend REST API
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Clean Frontend API Client calling the dedicated Backend API
 */
export const backendApi = {
  // --- Contratos ---
  contracts: {
    async getAll(): Promise<Contract[]> {
      try {
        return await request<Contract[]>('/api/contracts');
      } catch (err) {
        console.warn('[Frontend API] Error fetching contracts:', err);
        return [];
      }
    },
    async getById(id: string): Promise<Contract | null> {
      try {
        return await request<Contract>(`/api/contracts/${id}`);
      } catch {
        return null;
      }
    },
    async create(contract: Contract): Promise<Contract> {
      return await request<Contract>('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contract),
      });
    },
    async update(id: string, partial: Partial<Contract>): Promise<Contract> {
      return await request<Contract>(`/api/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(partial),
      });
    },
    async delete(id: string): Promise<boolean> {
      const res = await request<{ success: boolean }>(`/api/contracts/${id}`, {
        method: 'DELETE',
      });
      return res.success ?? true;
    },
  },

  // --- Fornecedores ---
  suppliers: {
    async getAll(): Promise<Supplier[]> {
      try {
        return await request<Supplier[]>('/api/suppliers');
      } catch (err) {
        console.warn('[Frontend API] Error fetching suppliers:', err);
        return [];
      }
    },
    async getById(id: string): Promise<Supplier | null> {
      try {
        return await request<Supplier>(`/api/suppliers/${id}`);
      } catch {
        return null;
      }
    },
    async create(supplier: Supplier): Promise<Supplier> {
      return await request<Supplier>('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplier),
      });
    },
    async update(id: string, partial: Partial<Supplier>): Promise<Supplier> {
      return await request<Supplier>(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(partial),
      });
    },
    async delete(id: string): Promise<boolean> {
      const res = await request<{ success: boolean }>(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });
      return res.success ?? true;
    },
  },

  // --- Colaboradores / Usuários ---
  users: {
    async getAll(): Promise<UserAccountItem[]> {
      try {
        return await request<UserAccountItem[]>('/api/users');
      } catch (err) {
        console.warn('[Frontend API] Error fetching users:', err);
        return [];
      }
    },
    async getById(id: string): Promise<UserAccountItem | null> {
      try {
        return await request<UserAccountItem>(`/api/users/${id}`);
      } catch {
        return null;
      }
    },
    async create(user: UserAccountItem): Promise<UserAccountItem> {
      return await request<UserAccountItem>('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      });
    },
    async update(id: string, partial: Partial<UserAccountItem>): Promise<UserAccountItem> {
      return await request<UserAccountItem>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(partial),
      });
    },
    async delete(id: string): Promise<boolean> {
      const res = await request<{ success: boolean }>(`/api/users/${id}`, {
        method: 'DELETE',
      });
      return res.success ?? true;
    },
  },

  // --- Trilha de Auditoria ---
  audit: {
    async getAll(limit = 50): Promise<AuditLog[]> {
      try {
        return await request<AuditLog[]>(`/api/audit?limit=${limit}`);
      } catch (err) {
        console.warn('[Frontend API] Error fetching audit logs:', err);
        return [];
      }
    },
    async create(log: AuditLog): Promise<AuditLog> {
      return await request<AuditLog>('/api/audit', {
        method: 'POST',
        body: JSON.stringify(log),
      });
    },
  },

  // --- Configurações Corporativas ---
  settings: {
    async get(): Promise<SystemSettings | null> {
      try {
        return await request<SystemSettings>('/api/settings');
      } catch {
        return null;
      }
    },
    async update(partial: Partial<SystemSettings>): Promise<SystemSettings> {
      return await request<SystemSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(partial),
      });
    },
  },

  // --- Indicadores & Estatísticas ---
  stats: {
    async get(): Promise<any> {
      try {
        return await request<any>('/api/stats');
      } catch {
        return null;
      }
    },
  },

  // --- Health Check ---
  health: {
    async check(): Promise<boolean> {
      try {
        const res = await request<{ status: string }>('/api/health');
        return res.status === 'ok';
      } catch {
        return false;
      }
    },
  },
};
