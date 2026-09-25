/**
 * Frontend Database Adapter
 * Completely decoupled from Firestore: all operations are routed through the dedicated Backend REST API.
 */
import { Contract, Supplier, UserAccountItem, AuditLog, SystemSettings } from '../types';
import { backendApi } from './api';

export const firebaseDb = {
  /**
   * Initializes backend health and verifies connection
   */
  async initializeDefaults() {
    try {
      await backendApi.health.check();
    } catch (err) {
      console.warn('[Frontend DB Adapter] Backend health check warning:', err);
    }
  },

  // --------------------------------------------------------------------------
  // COLABORADORES / USUÁRIOS
  // --------------------------------------------------------------------------
  subscribeUsers(callback: (users: UserAccountItem[]) => void) {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const users = await backendApi.users.getAll();
        if (isMounted) callback(users);
      } catch (err) {
        console.warn('[Frontend DB Adapter] Error fetching users from backend:', err);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  },

  async addUser(user: UserAccountItem) {
    try {
      await backendApi.users.create(user);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao adicionar colaborador:', err);
    }
  },

  async updateUser(userId: string, partial: Partial<UserAccountItem>) {
    try {
      await backendApi.users.update(userId, partial);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao atualizar colaborador:', err);
    }
  },

  async deleteUser(userId: string) {
    try {
      await backendApi.users.delete(userId);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao remover colaborador:', err);
    }
  },

  // --------------------------------------------------------------------------
  // CONTRATOS
  // --------------------------------------------------------------------------
  subscribeContracts(callback: (contracts: Contract[]) => void) {
    let isMounted = true;

    const fetchContracts = async () => {
      try {
        const contracts = await backendApi.contracts.getAll();
        if (isMounted) callback(contracts);
      } catch (err) {
        console.warn('[Frontend DB Adapter] Error fetching contracts from backend:', err);
      }
    };

    fetchContracts();
    const interval = setInterval(fetchContracts, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  },

  async saveContract(contract: Contract) {
    try {
      await backendApi.contracts.create(contract);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao salvar contrato:', err);
    }
  },

  async deleteContract(contractId: string) {
    try {
      await backendApi.contracts.delete(contractId);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao excluir contrato:', err);
    }
  },

  // --------------------------------------------------------------------------
  // FORNECEDORES
  // --------------------------------------------------------------------------
  subscribeSuppliers(callback: (suppliers: Supplier[]) => void) {
    let isMounted = true;

    const fetchSuppliers = async () => {
      try {
        const suppliers = await backendApi.suppliers.getAll();
        if (isMounted) callback(suppliers);
      } catch (err) {
        console.warn('[Frontend DB Adapter] Error fetching suppliers:', err);
      }
    };

    fetchSuppliers();
    const interval = setInterval(fetchSuppliers, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  },

  async saveSupplier(supplier: Supplier) {
    try {
      await backendApi.suppliers.create(supplier);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao salvar fornecedor:', err);
    }
  },

  async deleteSupplier(supplierId: string) {
    try {
      await backendApi.suppliers.delete(supplierId);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao excluir fornecedor:', err);
    }
  },

  // --------------------------------------------------------------------------
  // TRILHA DE AUDITORIA
  // --------------------------------------------------------------------------
  subscribeAuditLogs(callback: (logs: AuditLog[]) => void) {
    let isMounted = true;

    const fetchLogs = async () => {
      try {
        const logs = await backendApi.audit.getAll(50);
        if (isMounted) callback(logs);
      } catch (err) {
        console.warn('[Frontend DB Adapter] Error fetching audit logs:', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  },

  async addAuditLog(log: AuditLog) {
    try {
      await backendApi.audit.create(log);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao registrar auditoria:', err);
    }
  },

  // --------------------------------------------------------------------------
  // CONFIGURAÇÕES
  // --------------------------------------------------------------------------
  async getSettings(): Promise<SystemSettings | null> {
    try {
      return await backendApi.settings.get();
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao buscar configurações:', err);
      return null;
    }
  },

  async updateSettings(settings: Partial<SystemSettings>) {
    try {
      await backendApi.settings.update(settings);
    } catch (err) {
      console.error('[Frontend DB Adapter] Erro ao atualizar configurações:', err);
    }
  },
};
