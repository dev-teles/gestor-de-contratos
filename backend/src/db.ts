import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { Contract, Supplier, UserAccountItem, AuditLog, SystemSettings } from './types';
import { initialUsers, initialAuditLogs, initialSettings } from './initialData';

// Load Firebase configuration
let firebaseConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    firebaseConfig = JSON.parse(raw);
  }
} catch (err) {
  console.warn('[Backend DB] Warning reading firebase-applet-config.json:', err);
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

const CONTRACTS_COL = 'contracts';
const SUPPLIERS_COL = 'suppliers';
const USERS_COL = 'users';
const AUDIT_COL = 'audit';
const SETTINGS_COL = 'settings';

// In-memory memory fallback cache in case of offline/network hiccups
const cache = {
  contracts: new Map<string, Contract>(),
  suppliers: new Map<string, Supplier>(),
  users: new Map<string, UserAccountItem>(),
  audit: [] as AuditLog[],
  settings: { ...initialSettings } as SystemSettings,
  initialized: false,
};

export const backendDb = {
  async init() {
    if (cache.initialized) return;
    try {
      console.log('[Backend DB] Initializing Firestore connection...');

      // 1. Initialize Users (Colaboradores)
      const usersSnap = await getDocs(collection(firestore, USERS_COL));
      if (usersSnap.empty) {
        console.log('[Backend DB] Seeding initial users into Firestore...');
        for (const user of initialUsers) {
          await setDoc(doc(firestore, USERS_COL, user.id), user);
          cache.users.set(user.id, user);
        }
      } else {
        usersSnap.docs.forEach((d) => {
          const user = d.data() as UserAccountItem;
          cache.users.set(user.id, user);
        });
      }

      // 2. Load Contracts
      const contractsSnap = await getDocs(collection(firestore, CONTRACTS_COL));
      contractsSnap.docs.forEach((d) => {
        const c = d.data() as Contract;
        cache.contracts.set(c.id, c);
      });

      // 3. Load Suppliers
      const suppliersSnap = await getDocs(collection(firestore, SUPPLIERS_COL));
      suppliersSnap.docs.forEach((d) => {
        const s = d.data() as Supplier;
        cache.suppliers.set(s.id, s);
      });

      // 4. Load Audit Logs
      const auditSnap = await getDocs(collection(firestore, AUDIT_COL));
      if (auditSnap.empty) {
        for (const log of initialAuditLogs.slice(0, 15)) {
          await setDoc(doc(firestore, AUDIT_COL, log.id), log);
          cache.audit.push(log);
        }
      } else {
        cache.audit = auditSnap.docs.map((d) => d.data() as AuditLog);
      }

      // 5. Load Settings
      const settingsDocRef = doc(firestore, SETTINGS_COL, 'general');
      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        cache.settings = settingsSnap.data() as SystemSettings;
      } else {
        await setDoc(settingsDocRef, initialSettings);
      }

      cache.initialized = true;
      console.log(`[Backend DB] Initialized successfully. Contracts: ${cache.contracts.size}, Suppliers: ${cache.suppliers.size}, Users: ${cache.users.size}`);
    } catch (error) {
      console.error('[Backend DB] Error initializing Firestore, using fallback state:', error);
      initialUsers.forEach((u) => cache.users.set(u.id, u));
      cache.audit = [...initialAuditLogs];
      cache.initialized = true;
    }
  },

  // --- Contracts ---
  async getContracts(): Promise<Contract[]> {
    try {
      const snap = await getDocs(collection(firestore, CONTRACTS_COL));
      const list = snap.docs.map((d) => d.data() as Contract);
      cache.contracts.clear();
      list.forEach((c) => cache.contracts.set(c.id, c));
      return list;
    } catch (err) {
      console.warn('[Backend DB] getContracts fallback to cache:', err);
      return Array.from(cache.contracts.values());
    }
  },

  async getContractById(id: string): Promise<Contract | null> {
    try {
      const docSnap = await getDoc(doc(firestore, CONTRACTS_COL, id));
      if (docSnap.exists()) {
        return docSnap.data() as Contract;
      }
      return cache.contracts.get(id) || null;
    } catch {
      return cache.contracts.get(id) || null;
    }
  },

  async saveContract(contract: Contract): Promise<Contract> {
    cache.contracts.set(contract.id, contract);
    try {
      await setDoc(doc(firestore, CONTRACTS_COL, contract.id), contract);
    } catch (err) {
      console.error('[Backend DB] Error saving contract in Firestore:', err);
    }
    return contract;
  },

  async deleteContract(id: string): Promise<boolean> {
    cache.contracts.delete(id);
    try {
      await deleteDoc(doc(firestore, CONTRACTS_COL, id));
      return true;
    } catch (err) {
      console.error('[Backend DB] Error deleting contract in Firestore:', err);
      return false;
    }
  },

  // --- Suppliers ---
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const snap = await getDocs(collection(firestore, SUPPLIERS_COL));
      const list = snap.docs.map((d) => d.data() as Supplier);
      cache.suppliers.clear();
      list.forEach((s) => cache.suppliers.set(s.id, s));
      return list;
    } catch (err) {
      console.warn('[Backend DB] getSuppliers fallback to cache:', err);
      return Array.from(cache.suppliers.values());
    }
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const docSnap = await getDoc(doc(firestore, SUPPLIERS_COL, id));
      if (docSnap.exists()) {
        return docSnap.data() as Supplier;
      }
      return cache.suppliers.get(id) || null;
    } catch {
      return cache.suppliers.get(id) || null;
    }
  },

  async saveSupplier(supplier: Supplier): Promise<Supplier> {
    cache.suppliers.set(supplier.id, supplier);
    try {
      await setDoc(doc(firestore, SUPPLIERS_COL, supplier.id), supplier);
    } catch (err) {
      console.error('[Backend DB] Error saving supplier in Firestore:', err);
    }
    return supplier;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    cache.suppliers.delete(id);
    try {
      await deleteDoc(doc(firestore, SUPPLIERS_COL, id));
      return true;
    } catch (err) {
      console.error('[Backend DB] Error deleting supplier in Firestore:', err);
      return false;
    }
  },

  // --- Users / Collaborators ---
  async getUsers(): Promise<UserAccountItem[]> {
    try {
      const snap = await getDocs(collection(firestore, USERS_COL));
      const list = snap.docs.map((d) => d.data() as UserAccountItem);
      cache.users.clear();
      list.forEach((u) => cache.users.set(u.id, u));
      return list;
    } catch (err) {
      console.warn('[Backend DB] getUsers fallback to cache:', err);
      return Array.from(cache.users.values());
    }
  },

  async getUserById(id: string): Promise<UserAccountItem | null> {
    try {
      const docSnap = await getDoc(doc(firestore, USERS_COL, id));
      if (docSnap.exists()) {
        return docSnap.data() as UserAccountItem;
      }
      return cache.users.get(id) || null;
    } catch {
      return cache.users.get(id) || null;
    }
  },

  async createUser(user: UserAccountItem): Promise<UserAccountItem> {
    cache.users.set(user.id, user);
    try {
      await setDoc(doc(firestore, USERS_COL, user.id), user);
    } catch (err) {
      console.error('[Backend DB] Error creating user in Firestore:', err);
    }
    return user;
  },

  async updateUser(id: string, updates: Partial<UserAccountItem>): Promise<UserAccountItem | null> {
    const existing = cache.users.get(id);
    const updated = existing ? { ...existing, ...updates } : (updates as UserAccountItem);
    cache.users.set(id, updated);
    try {
      await updateDoc(doc(firestore, USERS_COL, id), updates);
    } catch (err) {
      console.error('[Backend DB] Error updating user in Firestore:', err);
    }
    return updated;
  },

  async deleteUser(id: string): Promise<boolean> {
    cache.users.delete(id);
    try {
      await deleteDoc(doc(firestore, USERS_COL, id));
      return true;
    } catch (err) {
      console.error('[Backend DB] Error deleting user in Firestore:', err);
      return false;
    }
  },

  // --- Audit Logs ---
  async getAuditLogs(limitCount = 50): Promise<AuditLog[]> {
    try {
      const snap = await getDocs(collection(firestore, AUDIT_COL));
      const list = snap.docs.map((d) => d.data() as AuditLog);
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      cache.audit = list;
      return list.slice(0, limitCount);
    } catch (err) {
      console.warn('[Backend DB] getAuditLogs fallback to cache:', err);
      return cache.audit.slice(0, limitCount);
    }
  },

  async addAuditLog(log: AuditLog): Promise<AuditLog> {
    cache.audit.unshift(log);
    try {
      await setDoc(doc(firestore, AUDIT_COL, log.id), log);
    } catch (err) {
      console.error('[Backend DB] Error adding audit log to Firestore:', err);
    }
    return log;
  },

  // --- Settings ---
  async getSettings(): Promise<SystemSettings> {
    try {
      const docSnap = await getDoc(doc(firestore, SETTINGS_COL, 'general'));
      if (docSnap.exists()) {
        cache.settings = docSnap.data() as SystemSettings;
      }
      return cache.settings;
    } catch {
      return cache.settings;
    }
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    cache.settings = { ...cache.settings, ...updates };
    try {
      await setDoc(doc(firestore, SETTINGS_COL, 'general'), cache.settings, { merge: true });
    } catch (err) {
      console.error('[Backend DB] Error updating settings in Firestore:', err);
    }
    return cache.settings;
  },
};
