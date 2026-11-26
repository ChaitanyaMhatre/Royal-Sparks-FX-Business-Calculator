'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import {
  BusinessEvent,
  EventMaterial,
  EventExpense,
  Payment,
  CashTransaction,
  InventoryItem,
  ActivityLog,
  UserProfile,
  SyncStatus,
  DashboardStats,
  EventFinancialSummary,
} from '@/types';
import { calculateDashboardStats, calculateEventFinances } from './calculations';
import { createClient, isSupabaseConfigured } from './supabase/client';
import seedBackupData from '@/lib/seedBackup.json';

// Single Common Credentials for All 3 Partners
export const COMMON_LOGIN_ID = 'royalsparks';
export const COMMON_LOGIN_ALT = 'admin@royalsparksfx.com';
export const COMMON_PASSWORD = 'RoyalSparks@2026';

// Initial 3 Business Members
export const INITIAL_MEMBERS: UserProfile[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    full_name: 'Member 1 (Admin & Managing Partner)',
    email: 'admin@royalsparksfx.com',
    role: 'admin',
    avatar_url: '/assets/royal-sparks-fx-logo.jpeg',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    full_name: 'Member 2 (Operations Lead)',
    email: 'operations@royalsparksfx.com',
    role: 'member',
    avatar_url: '/assets/royal-sparks-fx-logo.jpeg',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    full_name: 'Member 3 (Finance & Logistics)',
    email: 'finance@royalsparksfx.com',
    role: 'member',
    avatar_url: '/assets/royal-sparks-fx-logo.jpeg',
  },
];

// Initial Data with Verified Permanent Backup
export const INITIAL_INVENTORY: InventoryItem[] = (seedBackupData.inventory || []) as InventoryItem[];
export const INITIAL_EVENTS: BusinessEvent[] = (seedBackupData.events || []) as BusinessEvent[];
export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = (seedBackupData.cashTransactions || []) as CashTransaction[];
export const INITIAL_LOGS: ActivityLog[] = (seedBackupData.activityLogs || []) as ActivityLog[];
export const INITIAL_OPENING_BALANCE: number = Number(seedBackupData.openingBalance) || 600;

interface BusinessStoreContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (loginId: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  syncStatus: SyncStatus;
  events: BusinessEvent[];
  cashTransactions: CashTransaction[];
  inventory: InventoryItem[];
  activityLogs: ActivityLog[];
  openingBalance: number;
  stats: DashboardStats;
  isSupabaseLive: boolean;

  // Actions
  saveEvent: (eventData: Partial<BusinessEvent>) => Promise<{ success: boolean; id?: string; error?: string }>;
  deleteEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>;
  recordPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  addExpense: (expense: Omit<EventExpense, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateExpenseStatus: (expenseId: string, eventId: string, status: 'paid' | 'unpaid', paymentMethod?: string) => Promise<boolean>;
  recordCashAdjustment: (type: 'cash_added' | 'cash_withdrawn' | 'correction', amount: number, description: string) => Promise<boolean>;
  addMoney: (data: { amount: number; date?: string; description: string; category: string; payment_method: string }) => Promise<boolean>;
  withdrawMoney: (data: { amount: number; date?: string; description: string; category: string; payment_method: string; bypassLimit?: boolean }) => Promise<{ success: boolean; error?: string }>;
  updateOpeningBalance: (newBalance: number) => Promise<boolean>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'business_id'>) => Promise<boolean>;
  updateInventoryItem: (item: InventoryItem) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const BusinessStoreContext = createContext<BusinessStoreContextType | null>(null);

const STORAGE_KEY_PREFIX = 'royal_sparks_fx_clean_v2_';

export function BusinessStoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_MEMBERS[0]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connected');
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const [openingBalance, setOpeningBalance] = useState<number>(INITIAL_OPENING_BALANCE);
  const [events, setEvents] = useState<BusinessEvent[]>(INITIAL_EVENTS);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_LOGS);

  // Store reference to latest state for polling and event listeners
  const stateRef = useRef({
    events,
    cashTransactions,
    inventory,
    activityLogs,
    openingBalance,
  });

  useEffect(() => {
    stateRef.current = {
      events,
      cashTransactions,
      inventory,
      activityLogs,
      openingBalance,
    };
  }, [events, cashTransactions, inventory, activityLogs, openingBalance]);

  // Broadcast channel for instantaneous cross-tab synchronization between members
  const broadcastSync = useCallback((type: string, data: any) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('royal_sparks_sync');
        channel.postMessage({ type, data, sender: currentUser.full_name, timestamp: Date.now() });
        channel.close();
      } catch (err) {
        console.error('BroadcastChannel error', err);
      }
    }
  }, [currentUser]);

  // Persist state to centralized cloud (Vercel Blob)
  const persistToCloud = useCallback(
    async (
      eventsData: BusinessEvent[],
      cashData: CashTransaction[],
      invData: InventoryItem[],
      logsData: ActivityLog[],
      balData: number
    ) => {
      try {
        setSyncStatus('synchronizing');
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: eventsData,
            cashTransactions: cashData,
            inventory: invData,
            activityLogs: logsData,
            openingBalance: balData,
            user: currentUser.full_name,
          }),
        });
        if (res.ok) {
          setSyncStatus('connected');
        } else {
          console.warn('Central sync response status:', res.status);
          setSyncStatus('connected');
        }
      } catch (err) {
        console.warn('Central cloud sync error:', err);
        setSyncStatus('connected');
      }
    },
    [currentUser]
  );

  // Sync state FROM centralized cloud (Vercel Blob)
  const syncFromCloud = useCallback(
    async (isInitial = false) => {
      try {
        const timestamp = Date.now();
        const rand = Math.random().toString(36).substring(2, 7);
        const res = await fetch(`/api/sync?t=${timestamp}&r=${rand}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) return;
        const json = await res.json();

        if (json.success) {
          if (json.data) {
            const {
              events: cloudEvents,
              cashTransactions: cloudCash,
              inventory: cloudInv,
              activityLogs: cloudLogs,
              openingBalance: cloudBal,
            } = json.data;

            const hasCloudData =
              (cloudEvents && cloudEvents.length > 0) ||
              (cloudCash && cloudCash.length > 0) ||
              (cloudBal !== undefined && Number(cloudBal) > 0);

            if (isInitial && !hasCloudData) {
              // Cloud is empty. Check if THIS device has existing local data (e.g. from phone)
              const localEventsRaw = localStorage.getItem(STORAGE_KEY_PREFIX + 'events');
              const localEvents = localEventsRaw ? JSON.parse(localEventsRaw) : [];
              const localCashRaw = localStorage.getItem(STORAGE_KEY_PREFIX + 'cash');
              const localCash = localCashRaw ? JSON.parse(localCashRaw) : [];
              const localBal = Number(localStorage.getItem(STORAGE_KEY_PREFIX + 'balance') || 0);

              if (
                (localEvents && localEvents.length > 0) ||
                (localCash && localCash.length > 0) ||
                localBal > 0
              ) {
                // Upload this device's existing data to centralized cloud!
                await persistToCloud(
                  localEvents,
                  localCash,
                  stateRef.current.inventory,
                  stateRef.current.activityLogs,
                  localBal
                );
                return;
              }
            }

            // Only update state if cloud data has actually changed to prevent unwanted component re-renders!
            if (cloudEvents) {
              const currentEventsStr = JSON.stringify(stateRef.current.events);
              const cloudEventsStr = JSON.stringify(cloudEvents);
              if (currentEventsStr !== cloudEventsStr) {
                setEvents(cloudEvents);
                localStorage.setItem(STORAGE_KEY_PREFIX + 'events', cloudEventsStr);
              }
            }
            if (cloudCash) {
              const currentCashStr = JSON.stringify(stateRef.current.cashTransactions);
              const cloudCashStr = JSON.stringify(cloudCash);
              if (currentCashStr !== cloudCashStr) {
                setCashTransactions(cloudCash);
                localStorage.setItem(STORAGE_KEY_PREFIX + 'cash', cloudCashStr);
              }
            }
            if (cloudInv) {
              const currentInvStr = JSON.stringify(stateRef.current.inventory);
              const cloudInvStr = JSON.stringify(cloudInv);
              if (currentInvStr !== cloudInvStr) {
                setInventory(cloudInv);
                localStorage.setItem(STORAGE_KEY_PREFIX + 'inventory', cloudInvStr);
              }
            }
            if (cloudLogs) {
              const currentLogsStr = JSON.stringify(stateRef.current.activityLogs);
              const cloudLogsStr = JSON.stringify(cloudLogs);
              if (currentLogsStr !== cloudLogsStr) {
                setActivityLogs(cloudLogs);
                localStorage.setItem(STORAGE_KEY_PREFIX + 'logs', cloudLogsStr);
              }
            }
            if (cloudBal !== undefined && Number(cloudBal) !== stateRef.current.openingBalance) {
              setOpeningBalance(Number(cloudBal));
              localStorage.setItem(STORAGE_KEY_PREFIX + 'balance', String(cloudBal));
            }
          } else if (isInitial) {
            // First time initialization: cloud has null data.
            // Check if THIS device has stored data from earlier (e.g. user phone)
            const localEventsRaw = localStorage.getItem(STORAGE_KEY_PREFIX + 'events');
            const localEvents = localEventsRaw ? JSON.parse(localEventsRaw) : [];
            const localCashRaw = localStorage.getItem(STORAGE_KEY_PREFIX + 'cash');
            const localCash = localCashRaw ? JSON.parse(localCashRaw) : [];
            const localBal = Number(localStorage.getItem(STORAGE_KEY_PREFIX + 'balance') || 0);

            if (
              (localEvents && localEvents.length > 0) ||
              (localCash && localCash.length > 0) ||
              localBal > 0
            ) {
              await persistToCloud(
                localEvents,
                localCash,
                stateRef.current.inventory,
                stateRef.current.activityLogs,
                localBal
              );
            }
          }
        }
      } catch (err) {
        console.warn('Sync from cloud error:', err);
      }
    },
    [persistToCloud]
  );

  // Load saved state or default
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check Supabase connection
    const live = isSupabaseConfigured();
    setIsSupabaseLive(live);

    // Check shared login session
    try {
      const storedToken = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_token');
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('royal_sparks_session=authenticated');
      if (storedToken === 'authenticated' || hasCookie) {
        setIsAuthenticated(true);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAuth(false);
    }

    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_PREFIX + 'user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const match = INITIAL_MEMBERS.find(m => m.id === parsed.id);
        if (match) setCurrentUser(match);
      }

      const savedEvents = localStorage.getItem(STORAGE_KEY_PREFIX + 'events');
      if (savedEvents) setEvents(JSON.parse(savedEvents));

      const savedCash = localStorage.getItem(STORAGE_KEY_PREFIX + 'cash');
      if (savedCash) setCashTransactions(JSON.parse(savedCash));

      const savedInv = localStorage.getItem(STORAGE_KEY_PREFIX + 'inventory');
      if (savedInv) setInventory(JSON.parse(savedInv));

      const savedLogs = localStorage.getItem(STORAGE_KEY_PREFIX + 'logs');
      if (savedLogs) setActivityLogs(JSON.parse(savedLogs));

      const savedBal = localStorage.getItem(STORAGE_KEY_PREFIX + 'balance');
      if (savedBal) setOpeningBalance(Number(savedBal));
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }

    // Immediately trigger cloud sync to get centralized cross-device state
    syncFromCloud(true);

    // Auto-refresh when tab gains focus or becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromCloud(false);
      }
    };
    const handleFocus = () => {
      syncFromCloud(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic cloud poll every 3.5 seconds for instantaneous cross-device updates
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncFromCloud(false);
      }
    }, 3500);

    // Listen to BroadcastChannel for real-time multi-window sync
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('royal_sparks_sync');
      channel.onmessage = (event) => {
        setSyncStatus('synchronizing');
        const { type, data } = event.data;
        if (type === 'STATE_UPDATE') {
          if (data.events) setEvents(data.events);
          if (data.cashTransactions) setCashTransactions(data.cashTransactions);
          if (data.inventory) setInventory(data.inventory);
          if (data.activityLogs) setActivityLogs(data.activityLogs);
          if (data.openingBalance !== undefined) setOpeningBalance(data.openingBalance);
        }
        setTimeout(() => setSyncStatus('connected'), 400);
      };
    }

    // Setup Supabase Realtime if live credentials are provided
    if (live) {
      const supabase = createClient();
      if (supabase) {
        const sub = supabase
          .channel('royal_sparks_realtime')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            setSyncStatus('synchronizing');
            syncFromCloud(false);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(sub);
          channel?.close();
          window.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleFocus);
          clearInterval(intervalId);
        };
      }
    }

    return () => {
      channel?.close();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [syncFromCloud]);

  // Save to persistent storage and broadcast
  const persistState = useCallback(
    (
      newEvents: BusinessEvent[],
      newCash: CashTransaction[],
      newInv: InventoryItem[],
      newLogs: ActivityLog[],
      newBal: number
    ) => {
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'events', JSON.stringify(newEvents));
        localStorage.setItem(STORAGE_KEY_PREFIX + 'cash', JSON.stringify(newCash));
        localStorage.setItem(STORAGE_KEY_PREFIX + 'inventory', JSON.stringify(newInv));
        localStorage.setItem(STORAGE_KEY_PREFIX + 'logs', JSON.stringify(newLogs));
        localStorage.setItem(STORAGE_KEY_PREFIX + 'balance', newBal.toString());

        broadcastSync('STATE_UPDATE', {
          events: newEvents,
          cashTransactions: newCash,
          inventory: newInv,
          activityLogs: newLogs,
          openingBalance: newBal,
        });

        // Persist to centralized cloud store (accessible to all devices)
        persistToCloud(newEvents, newCash, newInv, newLogs, newBal);
      } catch (err) {
        console.error('Error persisting state', err);
      }
    },
    [broadcastSync, persistToCloud]
  );

  const switchUser = useCallback((userId: string) => {
    const user = INITIAL_MEMBERS.find((m) => m.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(user));
    }
  }, []);

  const logActivity = useCallback(
    (action: string, entity_type: string, description: string, entity_id?: string) => {
      const newLog: ActivityLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        business_id: 'b1',
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        action,
        entity_type,
        entity_id,
        description,
        created_at: new Date().toISOString(),
      };
      const updatedLogs = [newLog, ...activityLogs];
      setActivityLogs(updatedLogs);
      return updatedLogs;
    },
    [currentUser, activityLogs]
  );

  // SAVE EVENT (Create or Update with Concurrency Protection)
  const saveEvent = async (eventData: Partial<BusinessEvent>): Promise<{ success: boolean; id?: string; error?: string }> => {
    setSyncStatus('synchronizing');

    try {
      const isNew = !eventData.id;
      const eventId = eventData.id || 'evt-' + Date.now();

      let updatedEvents: BusinessEvent[];
      let updatedLogs: ActivityLog[];
      let updatedCash = [...cashTransactions];

      if (isNew) {
        const newEvent: BusinessEvent = {
          id: eventId,
          business_id: 'b1',
          event_name: eventData.event_name || 'Untitled Event',
          event_date: eventData.event_date || new Date().toISOString().split('T')[0],
          client_name: eventData.client_name || '',
          client_phone: eventData.client_phone || '',
          event_location: eventData.event_location || '',
          description: eventData.description || '',
          status: eventData.status || 'upcoming',
          total_client_charge: Number(eventData.total_client_charge) || 0,
          version: 1,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          materials: eventData.materials || [],
          expenses: eventData.expenses || [],
          payments: eventData.payments || [],
        };

        // If initial payments or paid expenses exist, reflect them in cash transactions
        if (newEvent.payments && newEvent.payments.length > 0) {
          for (const pmt of newEvent.payments) {
            const pmtAmount = Number(pmt.amount) || 0;
            if (pmtAmount > 0) {
              updatedCash.push({
                id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                business_id: 'b1',
                transaction_type: 'payment_received',
                amount: pmtAmount,
                description: `Payment for ${newEvent.event_name}`,
                event_id: newEvent.id,
                payment_id: pmt.id,
                transaction_date: pmt.payment_date || new Date().toISOString(),
                created_by_name: currentUser.full_name,
                created_at: new Date().toISOString(),
              });
            }
          }
        }

        if (newEvent.expenses && newEvent.expenses.length > 0) {
          for (const exp of newEvent.expenses) {
            if (exp.payment_status === 'paid' && Number(exp.amount) > 0) {
              updatedCash.push({
                id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                business_id: 'b1',
                transaction_type: 'expense_paid',
                amount: Number(exp.amount),
                description: `${exp.category}: ${exp.description || 'Expense'} (${newEvent.event_name})`,
                event_id: newEvent.id,
                expense_id: exp.id,
                transaction_date: exp.expense_date || new Date().toISOString(),
                created_by_name: currentUser.full_name,
                created_at: new Date().toISOString(),
              });
            }
          }
        }

        updatedEvents = [newEvent, ...events];
        updatedLogs = logActivity('Event Created', 'event', `Created event: ${newEvent.event_name}`, newEvent.id);
      } else {
        // Concurrency Check: Verify version
        const existingEvent = events.find((e) => e.id === eventId);
        if (existingEvent && eventData.version !== undefined && eventData.version < existingEvent.version) {
          setSyncStatus('error');
          return {
            success: false,
            error: 'Conflict detected: Another member updated this event. Please reload the latest event details.',
          };
        }

        // Process paid expenses difference or new payments
        const mergedEvent: BusinessEvent = {
          ...existingEvent!,
          ...eventData,
          version: (existingEvent?.version || 1) + 1,
          updated_at: new Date().toISOString(),
        };

        // Remove old transactions for this event so we don't have stale/duplicate cash entries
        updatedCash = updatedCash.filter(
          (tx) => !(tx.event_id === eventId && (tx.transaction_type === 'payment_received' || tx.transaction_type === 'expense_paid'))
        );

        // Re-add actual payments
        if (mergedEvent.payments && mergedEvent.payments.length > 0) {
          for (const pmt of mergedEvent.payments) {
            const pmtAmount = Number(pmt.amount) || 0;
            if (pmtAmount > 0) {
              updatedCash.unshift({
                id: pmt.id || 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                business_id: 'b1',
                transaction_type: 'payment_received',
                amount: pmtAmount,
                description: `Payment for ${mergedEvent.event_name}`,
                event_id: mergedEvent.id,
                payment_id: pmt.id,
                transaction_date: pmt.payment_date || new Date().toISOString(),
                created_by_name: currentUser.full_name,
                created_at: new Date().toISOString(),
              });
            }
          }
        }

        // Re-add actual paid expenses
        if (mergedEvent.expenses && mergedEvent.expenses.length > 0) {
          for (const exp of mergedEvent.expenses) {
            if (exp.payment_status === 'paid' && Number(exp.amount) > 0) {
              updatedCash.unshift({
                id: exp.id || 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                business_id: 'b1',
                transaction_type: 'expense_paid',
                amount: Number(exp.amount),
                description: `${exp.category}: ${exp.description || 'Expense'} (${mergedEvent.event_name})`,
                event_id: mergedEvent.id,
                expense_id: exp.id,
                transaction_date: exp.expense_date || new Date().toISOString(),
                created_by_name: currentUser.full_name,
                created_at: new Date().toISOString(),
              });
            }
          }
        }

        updatedEvents = events.map((e) => (e.id === eventId ? mergedEvent : e));
        updatedLogs = logActivity('Event Updated', 'event', `Updated event details for ${mergedEvent.event_name}`, mergedEvent.id);
      }

      setEvents(updatedEvents);
      setCashTransactions(updatedCash);
      persistState(updatedEvents, updatedCash, inventory, updatedLogs, openingBalance);

      setSyncStatus('connected');
      return { success: true, id: eventId };
    } catch (err: any) {
      setSyncStatus('error');
      return { success: false, error: err.message || 'Failed to save event' };
    }
  };

  // DELETE EVENT
  const deleteEvent = async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    setSyncStatus('synchronizing');
    const existing = events.find((e) => e.id === eventId);
    if (!existing) return { success: false, error: 'Event not found' };

    const updatedEvents = events.filter((e) => e.id !== eventId);
    const updatedCash = cashTransactions.filter((tx) => tx.event_id !== eventId);
    const updatedLogs = logActivity('Event Deleted', 'event', `Deleted event: ${existing.event_name}`, eventId);

    setEvents(updatedEvents);
    setCashTransactions(updatedCash);
    persistState(updatedEvents, updatedCash, inventory, updatedLogs, openingBalance);
    setSyncStatus('connected');
    return { success: true };
  };

  // RECORD PAYMENT
  const recordPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    setSyncStatus('synchronizing');
    const targetEvent = events.find((e) => e.id === paymentData.event_id);
    if (!targetEvent) return { success: false, error: 'Event not found' };

    const pmtId = 'pmt-' + Date.now();
    const newPayment: Payment = {
      ...paymentData,
      id: pmtId,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    const existingPayments = targetEvent.payments || [];
    const updatedPayments = [...existingPayments, newPayment];

    const updatedEvent: BusinessEvent = {
      ...targetEvent,
      payments: updatedPayments,
      version: targetEvent.version + 1,
      updated_at: new Date().toISOString(),
    };

    const updatedEvents = events.map((e) => (e.id === targetEvent.id ? updatedEvent : e));

    // Add to cash ledger
    const newCashTx: CashTransaction = {
      id: 'tx-' + Date.now(),
      business_id: 'b1',
      transaction_type: 'payment_received',
      amount: Number(paymentData.amount),
      description: `Client payment received for ${targetEvent.event_name} (${paymentData.payment_method.toUpperCase()})`,
      event_id: targetEvent.id,
      payment_id: pmtId,
      transaction_date: paymentData.payment_date || new Date().toISOString(),
      created_by_name: currentUser.full_name,
      created_at: new Date().toISOString(),
    };

    const updatedCash = [newCashTx, ...cashTransactions];
    const updatedLogs = logActivity(
      'Payment Recorded',
      'payment',
      `Recorded ₹${Number(paymentData.amount).toLocaleString('en-IN')} payment for ${targetEvent.event_name}`,
      targetEvent.id
    );

    setEvents(updatedEvents);
    setCashTransactions(updatedCash);
    persistState(updatedEvents, updatedCash, inventory, updatedLogs, openingBalance);

    setSyncStatus('connected');
    return { success: true };
  };

  // ADD EXPENSE
  const addExpense = async (expenseData: Omit<EventExpense, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    setSyncStatus('synchronizing');
    const targetEvent = events.find((e) => e.id === expenseData.event_id);
    if (!targetEvent) return { success: false, error: 'Event not found' };

    const expId = 'exp-' + Date.now();
    const newExpense: EventExpense = {
      ...expenseData,
      id: expId,
      created_at: new Date().toISOString(),
    };

    const existingExpenses = targetEvent.expenses || [];
    const updatedExpenses = [...existingExpenses, newExpense];

    const updatedEvent: BusinessEvent = {
      ...targetEvent,
      expenses: updatedExpenses,
      version: targetEvent.version + 1,
      updated_at: new Date().toISOString(),
    };

    const updatedEvents = events.map((e) => (e.id === targetEvent.id ? updatedEvent : e));
    let updatedCash = [...cashTransactions];

    if (newExpense.payment_status === 'paid' && Number(newExpense.amount) > 0) {
      const newCashTx: CashTransaction = {
        id: 'tx-' + Date.now(),
        business_id: 'b1',
        transaction_type: 'expense_paid',
        amount: Number(newExpense.amount),
        description: `${newExpense.category} expense paid for ${targetEvent.event_name}`,
        event_id: targetEvent.id,
        expense_id: expId,
        transaction_date: newExpense.expense_date || new Date().toISOString(),
        created_by_name: currentUser.full_name,
        created_at: new Date().toISOString(),
      };
      updatedCash = [newCashTx, ...updatedCash];
    }

    const updatedLogs = logActivity(
      'Expense Added',
      'expense',
      `Added ${newExpense.category} expense ₹${Number(newExpense.amount).toLocaleString('en-IN')} (${newExpense.payment_status.toUpperCase()}) for ${targetEvent.event_name}`,
      targetEvent.id
    );

    setEvents(updatedEvents);
    setCashTransactions(updatedCash);
    persistState(updatedEvents, updatedCash, inventory, updatedLogs, openingBalance);

    setSyncStatus('connected');
    return { success: true };
  };

  // UPDATE EXPENSE STATUS (e.g. Paid <-> Unpaid)
  const updateExpenseStatus = async (
    expenseId: string,
    eventId: string,
    status: 'paid' | 'unpaid',
    paymentMethod: string = 'upi'
  ): Promise<boolean> => {
    setSyncStatus('synchronizing');
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return false;

    let targetExpense: EventExpense | undefined;
    const updatedExpenses = (targetEvent.expenses || []).map((exp) => {
      if (exp.id === expenseId) {
        targetExpense = { ...exp, payment_status: status, payment_method: paymentMethod as any };
        return targetExpense;
      }
      return exp;
    });

    if (!targetExpense) return false;

    const updatedEvent: BusinessEvent = {
      ...targetEvent,
      expenses: updatedExpenses,
      version: targetEvent.version + 1,
      updated_at: new Date().toISOString(),
    };

    const updatedEvents = events.map((e) => (e.id === targetEvent.id ? updatedEvent : e));
    let updatedCash = [...cashTransactions];

    if (status === 'paid') {
      const newCashTx: CashTransaction = {
        id: 'tx-' + Date.now(),
        business_id: 'b1',
        transaction_type: 'expense_paid',
        amount: Number(targetExpense.amount),
        description: `Marked paid: ${targetExpense.category} (${targetEvent.event_name})`,
        event_id: targetEvent.id,
        expense_id: targetExpense.id,
        transaction_date: new Date().toISOString(),
        created_by_name: currentUser.full_name,
        created_at: new Date().toISOString(),
      };
      updatedCash = [newCashTx, ...updatedCash];
    } else {
      // If was paid before, remove matching cash transaction or add reversal
      updatedCash = updatedCash.filter((tx) => tx.expense_id !== expenseId);
    }

    const updatedLogs = logActivity(
      'Expense Status Changed',
      'expense',
      `Marked ${targetExpense.category} expense as ${status.toUpperCase()} for ${targetEvent.event_name}`,
      targetEvent.id
    );

    setEvents(updatedEvents);
    setCashTransactions(updatedCash);
    persistState(updatedEvents, updatedCash, inventory, updatedLogs, openingBalance);

    setSyncStatus('connected');
    return true;
  };

  // RECORD CASH ADJUSTMENT (Cash Added, Withdrawn, Correction)
  const recordCashAdjustment = async (
    type: 'cash_added' | 'cash_withdrawn' | 'correction',
    amount: number,
    description: string
  ): Promise<boolean> => {
    setSyncStatus('synchronizing');

    const newCashTx: CashTransaction = {
      id: 'tx-' + Date.now(),
      business_id: 'b1',
      transaction_type: type,
      amount: Math.abs(amount),
      description: description,
      transaction_date: new Date().toISOString(),
      created_by_name: currentUser.full_name,
      created_at: new Date().toISOString(),
    };

    const updatedCash = [newCashTx, ...cashTransactions];
    const updatedLogs = logActivity(
      'Cash Adjustment',
      'cash',
      `Manual adjustment (${type.replace('_', ' ').toUpperCase()}): ₹${Math.abs(amount).toLocaleString('en-IN')} - ${description}`
    );

    setCashTransactions(updatedCash);
    persistState(events, updatedCash, inventory, updatedLogs, openingBalance);
    setSyncStatus('connected');
    return true;
  };

  // ADD MONEY (Manual money added: capital, partner deposit, other income, balance correction)
  const addMoney = async (data: {
    amount: number;
    date?: string;
    description: string;
    category: string;
    payment_method: string;
  }): Promise<boolean> => {
    setSyncStatus('synchronizing');
    const amt = Math.abs(Number(data.amount));
    const txId = 'tx-' + Date.now();
    const newCashTx: CashTransaction = {
      id: txId,
      business_id: 'b1',
      transaction_type: 'cash_added',
      amount: amt,
      description: data.description || 'Manual Money Addition',
      category: data.category,
      payment_method: data.payment_method,
      transaction_date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      created_by_name: currentUser.full_name,
      created_at: new Date().toISOString(),
    };

    const updatedCash = [newCashTx, ...cashTransactions];
    const updatedLogs = logActivity(
      'Money Added',
      'cash',
      `Added ₹${amt.toLocaleString('en-IN')} (${data.category} - ${data.payment_method.toUpperCase()}): ${data.description}`
    );

    setCashTransactions(updatedCash);
    persistState(events, updatedCash, inventory, updatedLogs, openingBalance);
    setSyncStatus('connected');
    return true;
  };

  // WITHDRAW MONEY (Manual money withdrawn: personal withdrawal, business purchase, misc, other)
  const withdrawMoney = async (data: {
    amount: number;
    date?: string;
    description: string;
    category: string;
    payment_method: string;
    bypassLimit?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    setSyncStatus('synchronizing');
    const amt = Math.abs(Number(data.amount));

    // Calculate current available balance
    const currentStats = calculateDashboardStats(events, cashTransactions, openingBalance);
    if (!data.bypassLimit && amt > currentStats.currentBusinessBalance) {
      setSyncStatus('connected');
      return {
        success: false,
        error: `Withdrawal amount (₹${amt.toLocaleString('en-IN')}) exceeds current available balance (₹${currentStats.currentBusinessBalance.toLocaleString('en-IN')}). Accidental negative balance prevented.`,
      };
    }

    const txId = 'tx-' + Date.now();
    const newCashTx: CashTransaction = {
      id: txId,
      business_id: 'b1',
      transaction_type: 'cash_withdrawn',
      amount: amt,
      description: data.description || 'Manual Withdrawal',
      category: data.category,
      payment_method: data.payment_method,
      transaction_date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      created_by_name: currentUser.full_name,
      created_at: new Date().toISOString(),
    };

    const updatedCash = [newCashTx, ...cashTransactions];
    const updatedLogs = logActivity(
      'Money Withdrawn',
      'cash',
      `Withdrew ₹${amt.toLocaleString('en-IN')} (${data.category} - ${data.payment_method.toUpperCase()}): ${data.description}`
    );

    setCashTransactions(updatedCash);
    persistState(events, updatedCash, inventory, updatedLogs, openingBalance);
    setSyncStatus('connected');
    return { success: true };
  };

  // UPDATE OPENING BALANCE (Audited with confirmation)
  const updateOpeningBalance = async (newBalance: number): Promise<boolean> => {
    setSyncStatus('synchronizing');
    const oldBalance = openingBalance;
    setOpeningBalance(newBalance);

    // Update opening_balance in cashTransactions if it exists
    const updatedCash = cashTransactions.map((tx) =>
      tx.transaction_type === 'opening_balance' ? { ...tx, amount: newBalance } : tx
    );

    const updatedLogs = logActivity(
      'Opening Balance Updated',
      'settings',
      `Corrected opening business balance from ₹${oldBalance.toLocaleString('en-IN')} to ₹${newBalance.toLocaleString('en-IN')}`
    );
    setCashTransactions(updatedCash);
    persistState(events, updatedCash, inventory, updatedLogs, newBalance);
    setSyncStatus('connected');
    return true;
  };

  // INVENTORY OPERATIONS
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'business_id'>): Promise<boolean> => {
    setSyncStatus('synchronizing');
    const newItem: InventoryItem = {
      ...item,
      id: 'inv-' + Date.now(),
      business_id: 'b1',
      created_at: new Date().toISOString(),
    };
    const updatedInv = [newItem, ...inventory];
    const updatedLogs = logActivity('Inventory Added', 'inventory', `Added equipment item: ${newItem.item_name} (${newItem.total_quantity} ${newItem.unit})`);
    setInventory(updatedInv);
    persistState(events, cashTransactions, updatedInv, updatedLogs, openingBalance);
    setSyncStatus('connected');
    return true;
  };

  const updateInventoryItem = async (item: InventoryItem): Promise<boolean> => {
    setSyncStatus('synchronizing');
    const updatedInv = inventory.map((i) => (i.id === item.id ? item : i));
    const updatedLogs = logActivity('Inventory Updated', 'inventory', `Updated equipment item: ${item.item_name}`);
    setInventory(updatedInv);
    persistState(events, cashTransactions, updatedInv, updatedLogs, openingBalance);
    setSyncStatus('connected');
    return true;
  };

  const login = async (loginId: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedId = loginId.trim().toLowerCase();
    const trimmedPass = pass.trim();

    const isIdValid =
      trimmedId === COMMON_LOGIN_ID.toLowerCase() ||
      trimmedId === COMMON_LOGIN_ALT.toLowerCase();
    const isPassValid = trimmedPass === COMMON_PASSWORD;

    if (isIdValid && isPassValid) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_token', 'authenticated');
        document.cookie = `royal_sparks_session=authenticated; path=/; max-age=2592000; SameSite=Lax`;
      } catch {
        // ignore
      }
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid Login ID or Password. Please check and try again.',
    };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_token');
      document.cookie = `royal_sparks_session=; path=/; max-age=0; SameSite=Lax`;
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const refreshData = async () => {
    setSyncStatus('synchronizing');
    await syncFromCloud(false);
    setSyncStatus('connected');
  };

  const stats = calculateDashboardStats(events, cashTransactions, openingBalance);

  return (
    <BusinessStoreContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoadingAuth,
        login,
        logout,
        switchUser,
        syncStatus,
        events,
        cashTransactions,
        inventory,
        activityLogs,
        openingBalance,
        stats,
        isSupabaseLive,
        saveEvent,
        deleteEvent,
        recordPayment,
        addExpense,
        updateExpenseStatus,
        recordCashAdjustment,
        addMoney,
        withdrawMoney,
        updateOpeningBalance,
        addInventoryItem,
        updateInventoryItem,
        refreshData,
      }}
    >
      {children}
    </BusinessStoreContext.Provider>
  );
}

export function useBusinessStore() {
  const context = useContext(BusinessStoreContext);
  if (!context) {
    throw new Error('useBusinessStore must be used within a BusinessStoreProvider');
  }
  return context;
}
