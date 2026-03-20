import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { calculateNextBillingDate, calculateReminderDate, todayStr } from '@/utils/billing';

const USERS_KEY = '@ktutil_users_v3';
const SIMS_KEY = '@ktutil_sims_v3';
const PASSWORDS_KEY = '@ktutil_passwords_v3';
const SEEDED_KEY = '@ktutil_seeded_v3';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface SIMCard {
  id: string;
  userId: string;
  vendor: string;
  number: string;
  plan: string;
  planType: string;
  purchaseDate: string;
  nextBillingDate: string;
  reminderDate: string;
  dueDate: string;
  status: 'active' | 'inactive' | 'expired';
  amount: string;
  createdAt: string;
}

export interface PasswordEntry {
  id: string;
  userId: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  createdAt: string;
}

interface AppContextType {
  users: User[];
  sims: SIMCard[];
  passwords: PasswordEntry[];
  isLoading: boolean;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addSIM: (sim: Omit<SIMCard, 'id' | 'createdAt'>) => Promise<void>;
  updateSIM: (id: string, updates: Partial<SIMCard>) => Promise<void>;
  deleteSIM: (id: string) => Promise<void>;
  rechargeDone: (id: string) => Promise<void>;
  addPassword: (pw: Omit<PasswordEntry, 'id' | 'createdAt'>) => Promise<void>;
  updatePassword: (id: string, updates: Partial<PasswordEntry>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  importUsers: (data: Omit<User, 'id' | 'createdAt'>[]) => Promise<void>;
  importSIMs: (data: Omit<SIMCard, 'id' | 'createdAt'>[]) => Promise<void>;
  importPasswords: (data: Omit<PasswordEntry, 'id' | 'createdAt'>[]) => Promise<void>;
  replaceAll: (u: User[], s: SIMCard[], p: PasswordEntry[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Demo seed data ──────────────────────────────────────────────────────────
const today = todayStr();
const nextMonth = (() => {
  const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0];
})();
const lastMonth = (() => {
  const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
})();

const DEMO_USERS: User[] = [
  { id: 'u1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', address: 'MG Road, Indore, MP', createdAt: new Date().toISOString() },
  { id: 'u2', name: 'Priya Patel', phone: '8765432109', email: 'priya@example.com', address: 'Vijay Nagar, Indore, MP', createdAt: new Date().toISOString() },
];

const DEMO_SIMS: SIMCard[] = [
  { id: 's1', userId: 'u1', vendor: 'Airtel', number: '9876543210', plan: '2GB/Day Unlimited Calls', planType: 'monthly', purchaseDate: today, nextBillingDate: nextMonth, reminderDate: calculateReminderDate(nextMonth), dueDate: nextMonth, status: 'active', amount: '599', createdAt: new Date().toISOString() },
  { id: 's2', userId: 'u2', vendor: 'Jio', number: '8765432109', plan: '1.5GB/Day + Calls', planType: 'quarterly', purchaseDate: lastMonth, nextBillingDate: today, reminderDate: calculateReminderDate(today), dueDate: today, status: 'expired', amount: '399', createdAt: new Date().toISOString() },
  { id: 's3', userId: 'u1', vendor: 'VI', number: '7654321098', plan: '1GB/Day', planType: 'monthly', purchaseDate: lastMonth, nextBillingDate: lastMonth, reminderDate: calculateReminderDate(lastMonth), dueDate: lastMonth, status: 'inactive', amount: '299', createdAt: new Date().toISOString() },
];

const DEMO_PASSWORDS: PasswordEntry[] = [
  { id: 'p1', userId: 'u1', title: 'Gmail', username: 'rahul@gmail.com', password: 'Gmail@Pass123', url: 'https://mail.google.com', notes: 'Primary email', createdAt: new Date().toISOString() },
  { id: 'p2', userId: 'u2', title: 'Instagram', username: 'priya_patel', password: 'Insta#456', url: 'https://instagram.com', notes: '', createdAt: new Date().toISOString() },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [sims, setSims] = useState<SIMCard[]>([]);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const seeded = await AsyncStorage.getItem(SEEDED_KEY);
        if (!seeded) {
          await AsyncStorage.multiRemove(['@ktutil_seeded', '@ktutil_seeded_v2', USERS_KEY, SIMS_KEY, PASSWORDS_KEY]);
          await AsyncStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
          await AsyncStorage.setItem(SIMS_KEY, JSON.stringify(DEMO_SIMS));
          await AsyncStorage.setItem(PASSWORDS_KEY, JSON.stringify(DEMO_PASSWORDS));
          await AsyncStorage.setItem(SEEDED_KEY, 'true');
          setUsers(DEMO_USERS);
          setSims(DEMO_SIMS);
          setPasswords(DEMO_PASSWORDS);
        } else {
          const [u, s, p] = await Promise.all([
            AsyncStorage.getItem(USERS_KEY),
            AsyncStorage.getItem(SIMS_KEY),
            AsyncStorage.getItem(PASSWORDS_KEY),
          ]);
          setUsers(u ? JSON.parse(u) : []);
          setSims(s ? JSON.parse(s) : []);
          setPasswords(p ? JSON.parse(p) : []);
        }
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addUser = useCallback(async (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...user, id: generateId(), createdAt: new Date().toISOString() };
    setUsers(prev => {
      const updated = [...prev, newUser];
      AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...updates } : u);
      AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addSIM = useCallback(async (sim: Omit<SIMCard, 'id' | 'createdAt'>) => {
    const newSim: SIMCard = { ...sim, id: generateId(), createdAt: new Date().toISOString() };
    setSims(prev => {
      const updated = [...prev, newSim];
      AsyncStorage.setItem(SIMS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSIM = useCallback(async (id: string, updates: Partial<SIMCard>) => {
    setSims(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      AsyncStorage.setItem(SIMS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSIM = useCallback(async (id: string) => {
    setSims(prev => {
      const updated = prev.filter(s => s.id !== id);
      AsyncStorage.setItem(SIMS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const rechargeDone = useCallback(async (id: string) => {
    setSims(prev => {
      const updated = prev.map(s => {
        if (s.id !== id) return s;
        const newPurchaseDate = todayStr();
        const newNextBilling = calculateNextBillingDate(newPurchaseDate, s.planType || 'monthly', s.nextBillingDate);
        const newReminder = calculateReminderDate(newNextBilling);
        return {
          ...s,
          purchaseDate: newPurchaseDate,
          nextBillingDate: newNextBilling,
          reminderDate: newReminder,
          dueDate: newNextBilling,
          status: 'active' as const,
        };
      });
      AsyncStorage.setItem(SIMS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addPassword = useCallback(async (pw: Omit<PasswordEntry, 'id' | 'createdAt'>) => {
    const newPw: PasswordEntry = { ...pw, id: generateId(), createdAt: new Date().toISOString() };
    setPasswords(prev => {
      const updated = [...prev, newPw];
      AsyncStorage.setItem(PASSWORDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updatePassword = useCallback(async (id: string, updates: Partial<PasswordEntry>) => {
    setPasswords(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      AsyncStorage.setItem(PASSWORDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePassword = useCallback(async (id: string) => {
    setPasswords(prev => {
      const updated = prev.filter(p => p.id !== id);
      AsyncStorage.setItem(PASSWORDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const importUsers = useCallback(async (data: Omit<User, 'id' | 'createdAt'>[]) => {
    const newUsers = data.map(u => ({ ...u, id: generateId(), createdAt: new Date().toISOString() }));
    setUsers(prev => {
      const updated = [...prev, ...newUsers];
      AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const importSIMs = useCallback(async (data: Omit<SIMCard, 'id' | 'createdAt'>[]) => {
    const newSims = data.map(s => ({ ...s, id: generateId(), createdAt: new Date().toISOString() }));
    setSims(prev => {
      const updated = [...prev, ...newSims];
      AsyncStorage.setItem(SIMS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const importPasswords = useCallback(async (data: Omit<PasswordEntry, 'id' | 'createdAt'>[]) => {
    const newPws = data.map(p => ({ ...p, id: generateId(), createdAt: new Date().toISOString() }));
    setPasswords(prev => {
      const updated = [...prev, ...newPws];
      AsyncStorage.setItem(PASSWORDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ✅ FIX: replaceAll — React state + AsyncStorage दोनों sync में update
  const replaceAll = useCallback(async (u: User[], s: SIMCard[], p: PasswordEntry[]) => {
    setUsers(u);
    setSims(s);
    setPasswords(p);
    await Promise.all([
      AsyncStorage.setItem(USERS_KEY, JSON.stringify(u)),
      AsyncStorage.setItem(SIMS_KEY, JSON.stringify(s)),
      AsyncStorage.setItem(PASSWORDS_KEY, JSON.stringify(p)),
    ]);
  }, []);

  return (
    <AppContext.Provider value={{
      users, sims, passwords, isLoading,
      addUser, updateUser, deleteUser,
      addSIM, updateSIM, deleteSIM, rechargeDone,
      addPassword, updatePassword, deletePassword,
      importUsers, importSIMs, importPasswords,
      replaceAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
