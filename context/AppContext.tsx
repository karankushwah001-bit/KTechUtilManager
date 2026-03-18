import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { PlanType, addMonths, calculateNextBillingDate, calculateReminderDate, todayStr } from '@/utils/billing';

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
  planType: PlanType;
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
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addSIM: (sim: Omit<SIMCard, 'id' | 'createdAt'>) => Promise<void>;
  updateSIM: (id: string, sim: Partial<SIMCard>) => Promise<void>;
  deleteSIM: (id: string) => Promise<void>;
  rechargeDone: (id: string) => Promise<void>;
  addPassword: (pw: Omit<PasswordEntry, 'id' | 'createdAt'>) => Promise<void>;
  updatePassword: (id: string, pw: Partial<PasswordEntry>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  importUsers: (data: Omit<User, 'id' | 'createdAt'>[]) => Promise<void>;
  importSIMs: (data: Omit<SIMCard, 'id' | 'createdAt'>[]) => Promise<void>;
  importPasswords: (data: Omit<PasswordEntry, 'id' | 'createdAt'>[]) => Promise<void>;
  replaceAll: (users: User[], sims: SIMCard[], passwords: PasswordEntry[]) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const USERS_KEY = '@ktutil_users';
const SIMS_KEY = '@ktutil_sims';
const PASSWORDS_KEY = '@ktutil_passwords';
const SEEDED_KEY = '@ktutil_seeded_v3';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function offsetDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const TODAY = todayStr();
const PURCHASE_30_AGO = offsetDate(30);
const PURCHASE_20_AGO = offsetDate(20);
const PURCHASE_10_AGO = offsetDate(10);
const PURCHASE_45_AGO = offsetDate(45);

const DEMO_USERS: User[] = [
  {
    id: 'demo_user_1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@gmail.com',
    address: '123 MG Road, Bengaluru, Karnataka',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_user_2',
    name: 'Aman Verma',
    phone: '9123456789',
    email: 'aman.verma@yahoo.com',
    address: '45 Connaught Place, New Delhi',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_SIMS: SIMCard[] = [
  (() => {
    const purchaseDate = PURCHASE_30_AGO;
    const planType: PlanType = 'monthly';
    const nextBillingDate = calculateNextBillingDate(purchaseDate, planType);
    return {
      id: 'demo_sim_1',
      userId: 'demo_user_1',
      vendor: 'Airtel',
      number: '9876543210',
      plan: '2GB/Day - Unlimited Calls',
      planType,
      purchaseDate,
      nextBillingDate,
      reminderDate: calculateReminderDate(nextBillingDate),
      dueDate: nextBillingDate,
      status: 'active' as const,
      amount: '599',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  })(),
  (() => {
    const purchaseDate = TODAY;
    const planType: PlanType = 'monthly';
    const nextBillingDate = calculateNextBillingDate(purchaseDate, planType);
    return {
      id: 'demo_sim_2',
      userId: 'demo_user_1',
      vendor: 'Jio',
      number: '8765432109',
      plan: '1.5GB/Day - Unlimited Calls',
      planType,
      purchaseDate,
      nextBillingDate,
      reminderDate: calculateReminderDate(nextBillingDate),
      dueDate: nextBillingDate,
      status: 'active' as const,
      amount: '399',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    };
  })(),
  (() => {
    const purchaseDate = PURCHASE_10_AGO;
    const planType: PlanType = 'quarterly';
    const nextBillingDate = calculateNextBillingDate(purchaseDate, planType);
    return {
      id: 'demo_sim_3',
      userId: 'demo_user_2',
      vendor: 'VI',
      number: '9123456789',
      plan: 'Weekend Roaming Plan',
      planType,
      purchaseDate,
      nextBillingDate,
      reminderDate: calculateReminderDate(nextBillingDate),
      dueDate: nextBillingDate,
      status: 'active' as const,
      amount: '299',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
  })(),
  (() => {
    const purchaseDate = PURCHASE_45_AGO;
    const planType: PlanType = 'monthly';
    const nextBillingDate = calculateNextBillingDate(purchaseDate, planType);
    return {
      id: 'demo_sim_4',
      userId: 'demo_user_2',
      vendor: 'BSNL',
      number: '7012345678',
      plan: 'Monthly Prepaid',
      planType,
      purchaseDate,
      nextBillingDate,
      reminderDate: calculateReminderDate(nextBillingDate),
      dueDate: nextBillingDate,
      status: 'expired' as const,
      amount: '199',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    };
  })(),
];

const DEMO_PASSWORDS: PasswordEntry[] = [
  {
    id: 'demo_pw_1',
    userId: 'demo_user_1',
    title: 'Gmail',
    username: 'rahul.sharma@gmail.com',
    password: 'Rahul@Gmail#2024',
    url: 'https://mail.google.com',
    notes: 'Primary email account',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_pw_2',
    userId: 'demo_user_1',
    title: 'Facebook',
    username: 'rahul.sharma',
    password: 'FB@Rahul#Secure99',
    url: 'https://facebook.com',
    notes: 'Personal Facebook account',
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_pw_3',
    userId: 'demo_user_2',
    title: 'Instagram',
    username: 'aman_verma_official',
    password: 'Insta!Aman@2024',
    url: 'https://instagram.com',
    notes: 'Business account',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
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

  const saveUsers = useCallback(async (data: User[]) => {
    setUsers(data);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(data));
  }, []);

  const saveSims = useCallback(async (data: SIMCard[]) => {
    setSims(data);
    await AsyncStorage.setItem(SIMS_KEY, JSON.stringify(data));
  }, []);

  const savePasswords = useCallback(async (data: PasswordEntry[]) => {
    setPasswords(data);
    await AsyncStorage.setItem(PASSWORDS_KEY, JSON.stringify(data));
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

  const replaceAll = useCallback(async (u: User[], s: SIMCard[], p: PasswordEntry[]) => {
    await saveUsers(u);
    await saveSims(s);
    await savePasswords(p);
  }, [saveUsers, saveSims, savePasswords]);

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
