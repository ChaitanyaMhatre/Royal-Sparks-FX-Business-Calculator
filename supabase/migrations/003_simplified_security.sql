-- ============================================================================
-- ROYAL SPARKS FX - SIMPLIFIED SECURITY & ROW LEVEL SECURITY (RLS)
-- Migration 003: Strict 3-Partner Auth, Public Signup Disabling & Shared RLS
-- ============================================================================

-- 1. DISABLE PUBLIC REGISTRATION AT DATABASE LEVEL (Requirement 4)
-- Enforce that ONLY the 3 pre-authorized partners can exist in auth.users
CREATE OR REPLACE FUNCTION public.check_partner_registration()
RETURNS TRIGGER AS $$
BEGIN
    IF LOWER(TRIM(NEW.email)) NOT IN (
        'admin@royalsparksfx.com',
        'operations@royalsparksfx.com',
        'finance@royalsparksfx.com'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Public registration is strictly disabled. Only the 3 authorized Royal Sparks FX partners can access this business system.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users (if permissions permit in Supabase instance)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS trg_block_unauthorized_signup ON auth.users;
        CREATE TRIGGER trg_block_unauthorized_signup
            BEFORE INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.check_partner_registration();
    END IF;
EXCEPTION
    WHEN insufficient_privilege THEN
        -- Handled by application-level allowlist when run with restricted role
        NULL;
END $$;

-- 2. PARTNER VERIFICATION FUNCTION
-- Checks if currently authenticated session belongs to one of the 3 Royal Sparks FX partners
CREATE OR REPLACE FUNCTION public.is_royal_sparks_partner()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is authenticated and email matches the 3 authorized partners
    RETURN (
        auth.role() = 'authenticated' AND
        (
            auth.jwt() ->> 'email' IN (
                'admin@royalsparksfx.com',
                'operations@royalsparksfx.com',
                'finance@royalsparksfx.com'
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.email IN (
                    'admin@royalsparksfx.com',
                    'operations@royalsparksfx.com',
                    'finance@royalsparksfx.com'
                )
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. ENABLE RLS ON ALL BUSINESS TABLES
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. SIMPLIFIED ROW LEVEL SECURITY POLICIES (Requirement 5)
-- All 3 partners share FULL ACCESS to centralized business data
-- Strangers and unauthenticated requests are completely blocked

-- Drop existing complex or fragmented policies to keep everything clean & unified
DROP POLICY IF EXISTS "Partners full access to businesses" ON public.businesses;
CREATE POLICY "Partners full access to businesses" ON public.businesses
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to settings" ON public.business_settings;
CREATE POLICY "Partners full access to settings" ON public.business_settings
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to events" ON public.events;
CREATE POLICY "Partners full access to events" ON public.events
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to materials" ON public.event_materials;
CREATE POLICY "Partners full access to materials" ON public.event_materials
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to expenses" ON public.event_expenses;
CREATE POLICY "Partners full access to expenses" ON public.event_expenses
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to payments" ON public.payments;
CREATE POLICY "Partners full access to payments" ON public.payments
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to cash" ON public.cash_transactions;
CREATE POLICY "Partners full access to cash" ON public.cash_transactions
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to inventory" ON public.inventory_items;
CREATE POLICY "Partners full access to inventory" ON public.inventory_items
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners full access to activity logs" ON public.activity_logs;
CREATE POLICY "Partners full access to activity logs" ON public.activity_logs
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

DROP POLICY IF EXISTS "Partners access profiles" ON public.profiles;
CREATE POLICY "Partners access profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_royal_sparks_partner())
    WITH CHECK (public.is_royal_sparks_partner());

-- 5. SEED PROFILES FOR THE 3 PRE-AUTHORIZED BUSINESS MEMBERS
INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
VALUES
    ('u0000000-0000-0000-0000-000000000001', 'Member 1 (Admin & Managing Partner)', 'admin@royalsparksfx.com', 'admin', '/assets/royal-sparks-fx-logo.jpeg'),
    ('u0000000-0000-0000-0000-000000000002', 'Member 2 (Operations Lead)', 'operations@royalsparksfx.com', 'member', '/assets/royal-sparks-fx-logo.jpeg'),
    ('u0000000-0000-0000-0000-000000000003', 'Member 3 (Finance & Logistics)', 'finance@royalsparksfx.com', 'member', '/assets/royal-sparks-fx-logo.jpeg')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
