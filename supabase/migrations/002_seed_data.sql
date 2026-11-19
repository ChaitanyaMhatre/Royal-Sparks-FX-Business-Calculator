-- ================================================================
-- ROYAL SPARKS FX - SEED DATA SCRIPT
-- Seeds business workspace, members, inventory, initial cash & sample events
-- ================================================================

DO $$
DECLARE
    v_business_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_admin_id UUID := 'u0000000-0000-0000-0000-000000000001';
    v_member2_id UUID := 'u0000000-0000-0000-0000-000000000002';
    v_member3_id UUID := 'u0000000-0000-0000-0000-000000000003';
    v_event1_id UUID := 'e0000000-0000-0000-0000-000000000001';
    v_event2_id UUID := 'e0000000-0000-0000-0000-000000000002';
    v_event3_id UUID := 'e0000000-0000-0000-0000-000000000003';
    v_pmt1_id UUID := 'p0000000-0000-0000-0000-000000000001';
    v_pmt2_id UUID := 'p0000000-0000-0000-0000-000000000002';
    v_pmt3_id UUID := 'p0000000-0000-0000-0000-000000000003';
BEGIN
    -- 1. Create Business
    INSERT INTO public.businesses (id, business_name, tagline, logo_url, currency, phone, email, address)
    VALUES (
        v_business_id,
        'Royal Sparks FX',
        'Celebrating Your Special Moments',
        '/assets/royal-sparks-fx-logo.jpeg',
        'INR',
        '+91 98765 43210',
        'contact@royalsparksfx.com',
        'Headquarters, India'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Business Settings with Opening Balance
    INSERT INTO public.business_settings (id, business_id, opening_cash_balance)
    VALUES (
        's0000000-0000-0000-0000-000000000001',
        v_business_id,
        150000.00
    ) ON CONFLICT (business_id) DO NOTHING;

    -- 3. Inventory Items
    INSERT INTO public.inventory_items (business_id, item_name, category, total_quantity, available_quantity, unit, purchase_cost, notes)
    VALUES
        (v_business_id, 'Sparcular Cold Spark Machine', 'SFX Machines', 12, 10, 'units', 22000.00, 'Cold spark machines for indoor/outdoor stage fireworks'),
        (v_business_id, 'SFX Wireless Controller', 'Controllers', 4, 3, 'units', 15000.00, 'Wireless firing controller console with DMX support'),
        (v_business_id, 'SFX Receivers', 'Receivers', 16, 12, 'units', 4500.00, '4-channel stage cue receivers'),
        (v_business_id, 'Rotating Fanwheel Pyro Rig', 'Special Effects', 4, 3, 'units', 18000.00, 'Motorized 6-arm rotating fanwheel pyro fixture'),
        (v_business_id, 'TMC Wireless Controller', 'Controllers', 2, 2, 'units', 25000.00, 'Time Machine Controller console'),
        (v_business_id, 'TMC Synchronized Receivers', 'Receivers', 8, 6, 'units', 5000.00, 'High precision sync receivers'),
        (v_business_id, 'Flame Thrower Projector', 'SFX Machines', 6, 4, 'units', 28000.00, 'DMX Controlled LPG flame projector'),
        (v_business_id, 'DMX Signal Splitter & Cables', 'DMX Equipment', 10, 8, 'sets', 6000.00, 'Heavy duty optical isolated DMX distributors')
    ON CONFLICT DO NOTHING;

    -- 4. Initial Cash Transaction for Opening Balance
    INSERT INTO public.cash_transactions (business_id, transaction_type, amount, description, transaction_date)
    VALUES
        (v_business_id, 'opening_balance', 150000.00, 'Opening Business Cash & Bank Balance', NOW() - INTERVAL '30 days')
    ON CONFLICT DO NOTHING;

END $$;
