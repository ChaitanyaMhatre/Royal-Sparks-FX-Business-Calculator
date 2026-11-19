-- ================================================================
-- ROYAL SPARKS FX - DATABASE SCHEMA
-- Production-Ready Supabase PostgreSQL Schema with RLS & Realtime
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL DEFAULT 'Royal Sparks FX',
    tagline TEXT DEFAULT 'Celebrating Your Special Moments',
    logo_url TEXT DEFAULT '/assets/royal-sparks-fx-logo.jpeg',
    currency TEXT NOT NULL DEFAULT 'INR',
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESS MEMBERS
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- 4. BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    opening_cash_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    event_location TEXT,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'completed', 'cancelled')) DEFAULT 'upcoming',
    total_client_charge NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENT MATERIALS
CREATE TABLE IF NOT EXISTS public.event_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_expense NUMERIC(14, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EVENT EXPENSES (Additional Expenses)
CREATE TABLE IF NOT EXISTS public.event_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Transportation', 'Labour', 'Equipment Rental', 'Food', 'Accommodation', 'Miscellaneous')),
    description TEXT,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    expense_date DATE DEFAULT CURRENT_DATE,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'unpaid')) DEFAULT 'unpaid',
    payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'other', 'none')) DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'other')) DEFAULT 'cash',
    notes TEXT,
    transaction_reference TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CASH TRANSACTIONS (Centralized Ledger)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('opening_balance', 'payment_received', 'expense_paid', 'cash_added', 'cash_withdrawn', 'correction')),
    amount NUMERIC(14, 2) NOT NULL,
    description TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    expense_id UUID REFERENCES public.event_expenses(id) ON DELETE SET NULL,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'units',
    purchase_cost NUMERIC(14, 2) DEFAULT 0.00,
    purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INVENTORY USAGE
CREATE TABLE IF NOT EXISTS public.inventory_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity_used INTEGER NOT NULL DEFAULT 1,
    quantity_returned INTEGER NOT NULL DEFAULT 0,
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_events_business_id ON public.events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_materials_event ON public.event_materials(event_id);
CREATE INDEX IF NOT EXISTS idx_event_expenses_event ON public.event_expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_event ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_business ON public.cash_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business ON public.inventory_items(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_business ON public.activity_logs(business_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Members of business have access to all business records)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Business members policy helper function
CREATE OR REPLACE FUNCTION public.is_business_member(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.business_members
        WHERE business_id = b_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Universal business access policy
CREATE POLICY "Business members access businesses" ON public.businesses
    FOR ALL USING (public.is_business_member(id));

CREATE POLICY "Business members access settings" ON public.business_settings
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business members access events" ON public.events
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business members access event materials" ON public.event_materials
    FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_materials.event_id AND public.is_business_member(events.business_id)));

CREATE POLICY "Business members access event expenses" ON public.event_expenses
    FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_expenses.event_id AND public.is_business_member(events.business_id)));

CREATE POLICY "Business members access payments" ON public.payments
    FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = payments.event_id AND public.is_business_member(events.business_id)));

CREATE POLICY "Business members access cash transactions" ON public.cash_transactions
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business members access inventory" ON public.inventory_items
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business members access inventory usage" ON public.inventory_usage
    FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = inventory_usage.event_id AND public.is_business_member(events.business_id)));

CREATE POLICY "Business members access activity logs" ON public.activity_logs
    FOR ALL USING (public.is_business_member(business_id));

-- ENABLE REALTIME ON KEY TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
