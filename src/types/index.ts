export type UserRole = 'admin' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
}

export interface Business {
  id: string;
  business_name: string;
  tagline: string;
  logo_url: string;
  currency: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  opening_cash_balance: number;
  updated_at?: string;
}

export type EventStatus = 'upcoming' | 'completed' | 'cancelled';

export interface EventMaterial {
  id: string;
  event_id: string;
  material_name: string;
  quantity: number;
  unit_price: number;
  total_expense: number;
  created_at?: string;
}

export type ExpenseCategory =
  | 'Transportation'
  | 'Labour'
  | 'Equipment Rental'
  | 'Food'
  | 'Accommodation'
  | 'Miscellaneous';

export type PaymentStatus = 'paid' | 'unpaid';

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other' | 'none';

export interface EventExpense {
  id: string;
  event_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at?: string;
}

export interface Payment {
  id: string;
  event_id: string;
  amount: number;
  payment_date: string;
  payment_method: Exclude<PaymentMethod, 'none'>;
  notes?: string;
  transaction_reference?: string;
  created_by?: string;
  created_at?: string;
}

export interface BusinessEvent {
  id: string;
  business_id: string;
  event_name: string;
  event_date: string; // YYYY-MM-DD
  client_name: string;
  client_phone?: string;
  event_location?: string;
  description?: string;
  status: EventStatus;
  total_client_charge: number;
  version: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  materials?: EventMaterial[];
  expenses?: EventExpense[];
  payments?: Payment[];
}

export type CashTransactionType =
  | 'opening_balance'
  | 'payment_received'
  | 'expense_paid'
  | 'cash_added'
  | 'cash_withdrawn'
  | 'correction';

export interface CashTransaction {
  id: string;
  business_id: string;
  transaction_type: CashTransactionType;
  amount: number;
  description: string;
  category?: string;
  payment_method?: string;
  event_id?: string;
  event_name?: string;
  payment_id?: string;
  expense_id?: string;
  transaction_date: string;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  business_id: string;
  item_name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  unit: string;
  purchase_cost: number;
  purchase_date?: string;
  notes?: string;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  business_id: string;
  user_id?: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface EventFinancialSummary {
  materialExpenses: number;
  additionalExpenses: number;
  totalExpenses: number;
  clientCharge: number;
  totalReceived: number;
  pendingPayment: number;
  expectedProfit: number;
  paidExpenses: number;
  unpaidExpenses: number;
}

export interface DashboardStats {
  totalEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  cancelledEvents: number;
  totalRevenue: number;
  totalMaterialExpenses: number;
  totalAdditionalExpenses: number;
  totalExpenses: number;
  overallProfit: number;
  totalReceived: number;
  pendingPayments: number;
  availableCash: number;
  currentBusinessBalance: number;
  openingCashBalance: number;
  totalClientPaymentsReceived: number;
  totalPaidExpenses: number;
  manualMoneyAdded: number;
  manualMoneyWithdrawn: number;
  unpaidExpenses: number;
}

export type SyncStatus = 'connected' | 'synchronizing' | 'offline' | 'error';
