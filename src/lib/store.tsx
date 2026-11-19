'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
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

// Initial Empty Inventory
export const INITIAL_INVENTORY: InventoryItem[] = [];

// Initial Empty Events
export const INITIAL_EVENTS: BusinessEvent[] = [];

// Initial Empty Cash Transactions Ledger
export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [];

// Initial Empty Activity Logs
export const INITIAL_LOGS: ActivityLog[] = [];

interface BusinessStoreContextType {
  currentUser: UserProfile;
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

  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [events, setEvents] = useState<BusinessEvent[]>(INITIAL_EVENTS);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_LOGS);

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

  // Load saved state or default
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check Supabase connection
    const live = isSupabaseConfigured();
    setIsSupabaseLive(live);

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
            // Fetch fresh database records
            setTimeout(() => setSyncStatus('connected'), 500);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(sub);
          channel?.close();
        };
      }
    }

    return () => {
      channel?.close();
    };
  }, []);

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
      } catch (err) {
        console.error('Error persisting state', err);
      }
    },
    [broadcastSync]
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
    // Remove linked cash transactions or keep with note?
    // Let's keep cash transactions audited or marked
    const updatedLogs = logActivity('Event Deleted', 'event', `Deleted event: ${existing.event_name}`, eventId);

    setEvents(updatedEvents);
    persistState(updatedEvents, cashTransactions, inventory, updatedLogs, openingBalance);
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

  const refreshData = async () => {
    setSyncStatus('synchronizing');
    await new Promise((res) => setTimeout(res, 400));
    setSyncStatus('connected');
  };

  const stats = calculateDashboardStats(events, cashTransactions, openingBalance);

  return (
    <BusinessStoreContext.Provider
      value={{
        currentUser,
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
