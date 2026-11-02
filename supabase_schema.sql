-- ====================================================================
-- HR MOTOR GARUT - CRM DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Project: Customer Relationship Management (CRM) for Used Car Dealership
-- Location: Garut, Jawa Barat, Indonesia
-- Version: 2.0 (Full Support: Stok Unit, Riwayat Garansi, Follow-up Showroom)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'Owner',
        'CRM Administrator',
        'Sales Representative',
        'WhatsApp Administrator',
        'Marketing'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pipeline_stage_enum AS ENUM (
        'Menanyakan Unit',
        'Tertarik',
        'Cek Unit',
        'Negosiasi',
        'Deal',
        'Lost'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lead_source_enum AS ENUM (
        'Facebook',
        'Instagram',
        'TikTok',
        'WhatsApp',
        'Walk-in',
        'Referral',
        'Other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. USERS & ROLES
CREATE TABLE IF NOT EXISTS public.crm_users (
    id VARCHAR(50) PRIMARY KEY, -- e.g. USR-001
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'Sales Representative',
    avatar_url TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id VARCHAR(50) PRIMARY KEY, -- e.g. CUST-2026-001
    full_name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL, -- Kecamatan di Garut (Tarogong Kidul, Samarang, dll)
    source VARCHAR(50) NOT NULL DEFAULT 'Walk-in',
    interested_vehicle VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL, -- MPV, SUV, City Car, Sedan, dll
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    assigned_sales_id VARCHAR(50) REFERENCES public.crm_users(id) ON DELETE SET NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Aktif',
    registered_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. VEHICLE STOCKS (MANAJEMEN STOK UNIT SHOWROOM)
CREATE TABLE IF NOT EXISTS public.vehicle_stocks (
    id VARCHAR(50) PRIMARY KEY, -- e.g. STK-2026-001
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    transmission VARCHAR(50) NOT NULL DEFAULT 'Manual', -- Manual, Otomatis, CVT
    fuel VARCHAR(50) NOT NULL DEFAULT 'Bensin', -- Bensin, Diesel, Hybrid
    mileage INT NOT NULL DEFAULT 0,
    price NUMERIC(15, 2) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    photos JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Tersedia', -- Tersedia, Terjual, Tidak Aktif
    license_plate VARCHAR(30), -- e.g. Z 1482 DA
    plate_number VARCHAR(30),
    engine_number VARCHAR(100),
    chassis_number VARCHAR(100),
    tax_valid_until DATE,
    sold_date DATE,
    sold_to_customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE SET NULL,
    sold_to_customer_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. LEADS (PROSPEK & MATCHING STOK)
CREATE TABLE IF NOT EXISTS public.leads (
    id VARCHAR(50) PRIMARY KEY, -- e.g. LEAD-2026-001
    customer_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    customer_phone VARCHAR(50),
    email VARCHAR(255),
    lead_source VARCHAR(50) NOT NULL DEFAULT 'WhatsApp',
    interested_vehicle VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(50),
    estimated_budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    assigned_sales_id VARCHAR(50) REFERENCES public.crm_users(id) ON DELETE SET NULL,
    assigned_sales_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Menanyakan Unit',
    notes TEXT,
    lost_reason TEXT,
    lost_reason_category VARCHAR(100),
    visit_notes TEXT,
    visit_date DATE,
    negotiation_offer NUMERIC(15, 2),
    negotiation_notes TEXT,
    stage_history JSONB DEFAULT '[]'::jsonb,
    deal_value NUMERIC(15, 2),
    deal_vehicle VARCHAR(255),
    deal_date DATE,
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE SET NULL,
    -- Preferensi Unit Dicari untuk Otomatisasi Pencocokan Stok
    search_brand VARCHAR(100),
    search_model VARCHAR(150),
    search_year_min INT,
    search_year_max INT,
    search_budget_min NUMERIC(15, 2),
    search_budget_max NUMERIC(15, 2),
    search_transmission VARCHAR(50),
    search_color VARCHAR(50),
    search_notes TEXT,
    last_contact_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. FOLLOW-UPS (DENGAN 3 KATEGORI SHOWROOM & RIWAYAT LOG)
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id VARCHAR(50) PRIMARY KEY, -- e.g. FLW-2026-001
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id VARCHAR(50) REFERENCES public.leads(id) ON DELETE CASCADE,
    vehicle_stock_id VARCHAR(50) REFERENCES public.vehicle_stocks(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    vehicle_info VARCHAR(255),
    category VARCHAR(100) NOT NULL DEFAULT 'Prospek Tidak Jadi (1 Bulan)',
    follow_up_reason TEXT,
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    scheduled_time TIME NOT NULL DEFAULT '09:00:00',
    channel VARCHAR(50) NOT NULL DEFAULT 'WhatsApp',
    status VARCHAR(50) NOT NULL DEFAULT 'Belum Dihubungi',
    priority VARCHAR(50) NOT NULL DEFAULT 'Sedang',
    assigned_sales_id VARCHAR(50) REFERENCES public.crm_users(id) ON DELETE SET NULL,
    assigned_sales_name VARCHAR(255),
    notes TEXT,
    result_notes TEXT,
    is_unit_sold BOOLEAN NOT NULL DEFAULT false,
    communication_logs JSONB DEFAULT '[]'::jsonb,
    last_contact_date TIMESTAMPTZ,
    last_outcome VARCHAR(255),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. COMMUNICATIONS
CREATE TABLE IF NOT EXISTS public.communications (
    id VARCHAR(50) PRIMARY KEY, -- e.g. COMM-2026-001
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id VARCHAR(50) REFERENCES public.leads(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'WhatsApp',
    direction VARCHAR(20) NOT NULL DEFAULT 'Keluar',
    template_id VARCHAR(50),
    message_content TEXT NOT NULL,
    notes TEXT,
    logged_by_id VARCHAR(50) REFERENCES public.crm_users(id) ON DELETE SET NULL,
    logged_by_name VARCHAR(255),
    last_contact_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    next_contact_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. CUSTOMER PURCHASES (DEAL TRANSAKSI KENDARAAN)
CREATE TABLE IF NOT EXISTS public.customer_purchases (
    id VARCHAR(50) PRIMARY KEY, -- e.g. DEAL-2026-001
    customer_id VARCHAR(50) NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    lead_id VARCHAR(50) REFERENCES public.leads(id) ON DELETE SET NULL,
    vehicle_brand VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_year INT NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    mileage_km INT NOT NULL DEFAULT 0,
    purchase_price NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    warranty_until DATE NOT NULL,
    sales_id VARCHAR(50) REFERENCES public.crm_users(id) ON DELETE SET NULL,
    sales_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. REPAIR CLAIMS (RIWAYAT PERBAIKAN GARANSI & NON-GARANSI)
CREATE TABLE IF NOT EXISTS public.repair_claims (
    id VARCHAR(50) PRIMARY KEY, -- e.g. RPR-2026-001
    claim_number VARCHAR(50),
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    vehicle_brand VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_year INT NOT NULL,
    purchase_date DATE,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    claim_type VARCHAR(50) NOT NULL DEFAULT 'Garansi', -- Garansi / Non-Garansi
    complaint_or_damage TEXT NOT NULL,
    parts_to_repair TEXT NOT NULL,
    damage_category VARCHAR(100) NOT NULL DEFAULT 'Mesin',
    repair_action_description TEXT,
    sparepart_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    service_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Menunggu', -- Menunggu, Dalam Proses, Selesai, Dibatalkan
    notes TEXT,
    completed_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. CUSTOMER FEEDBACK & SATISFACTION
CREATE TABLE IF NOT EXISTS public.customer_feedback (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    purchase_id VARCHAR(50) REFERENCES public.customer_purchases(id) ON DELETE SET NULL,
    vehicle_info VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    nps_score INT NOT NULL CHECK (nps_score >= 1 AND nps_score <= 10),
    category VARCHAR(100) NOT NULL,
    comment TEXT,
    follow_up_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 12. CUSTOMER COMPLAINTS
CREATE TABLE IF NOT EXISTS public.customer_complaints (
    id VARCHAR(50) PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    purchase_id VARCHAR(50) REFERENCES public.customer_purchases(id) ON DELETE SET NULL,
    vehicle_info VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Sedang',
    status VARCHAR(50) NOT NULL DEFAULT 'Baru',
    assigned_to_id VARCHAR(50) REFERENCES public.crm_users(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(255),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 13. REFERRALS (RETENTION MODULE)
CREATE TABLE IF NOT EXISTS public.referrals (
    id VARCHAR(50) PRIMARY KEY,
    referrer_customer_id VARCHAR(50) NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    referrer_customer_name VARCHAR(255) NOT NULL,
    referred_name VARCHAR(255) NOT NULL,
    referred_phone VARCHAR(50) NOT NULL,
    interested_vehicle VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Prospek Baru',
    reward_amount NUMERIC(15, 2) NOT NULL DEFAULT 1500000,
    reward_status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Transaksi',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. ACTIVITY LOGS (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 15. CRM CLOUD SNAPSHOT (UNTUK PERSISTENSI VERCEL SERVERLESS OTOMATIS)
CREATE TABLE IF NOT EXISTS public.crm_snapshots (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'latest',
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON public.customers(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON public.vehicle_stocks(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON public.follow_ups(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_repair_claims_status ON public.repair_claims(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
-- Diaktifkan dengan kebijakan akses penuh untuk anon & authenticated key
-- agar aplikasi CRM dapat berjalan lancar baik di local maupun di hosting Vercel.
ALTER TABLE public.crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for crm_users" ON public.crm_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for vehicle_stocks" ON public.vehicle_stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for follow_ups" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for communications" ON public.communications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customer_purchases" ON public.customer_purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for repair_claims" ON public.repair_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customer_feedback" ON public.customer_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customer_complaints" ON public.customer_complaints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for referrals" ON public.referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for crm_snapshots" ON public.crm_snapshots FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- SEED DATA AWAL HR MOTOR GARUT (DATA REALISTIS SIAP PAKAI)
-- ====================================================================

-- 1. Users
INSERT INTO public.crm_users (id, email, full_name, phone, role, is_approved, is_active) VALUES
('USR-001', 'owner@hrmotor.id', 'H. Rahmat Hidayat', '081223450001', 'Owner', true, true),
('USR-002', 'admin@hrmotor.id', 'Deni Pratama, S.T.', '081223450002', 'CRM Administrator', true, true),
('USR-003', 'sales.asep@hrmotor.id', 'Asep Kurniawan', '081324560003', 'Sales Representative', true, true),
('USR-004', 'sales.rina@hrmotor.id', 'Rina Sulaeman', '081324560004', 'Sales Representative', true, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Stok Kendaraan Showroom
INSERT INTO public.vehicle_stocks (id, brand, model, year, color, transmission, fuel, mileage, price, entry_date, status, license_plate, description) VALUES
('STK-2026-001', 'Toyota', 'Avanza 1.3 G M/T', 2020, 'Hitam Metalik', 'Manual', 'Bensin', 46200, 178000000, '2026-08-15', 'Tersedia', 'Z 1482 DA', 'Kondisi istimewa, tangan pertama dari baru, service record resmi Auto2000, AC dingin double blower, ban tebal 90%.'),
('STK-2026-002', 'Mitsubishi', 'Xpander Ultimate A/T', 2021, 'Putih Mutiara', 'Otomatis', 'Bensin', 34500, 228000000, '2026-09-10', 'Tersedia', 'D 1899 ULM', 'Varian tertinggi Ultimate, keyless start-stop engine, cruise control, interior beige bersih bebas asap rokok.'),
('STK-2026-003', 'Toyota', 'Innova Reborn 2.4 V Diesel A/T', 2020, 'Abu-abu Metalik', 'Otomatis', 'Diesel', 58000, 345000000, '2026-06-01', 'Tersedia', 'B 2210 SJD', 'Mesin diesel 2GD bertenaga dan irit, tipe V lengkap dengan ambient lighting, AC digital auto, kaki-kaki senyap.'),
('STK-2026-004', 'Daihatsu', 'Sigra 1.2 R Deluxe M/T', 2022, 'Merah Metalik', 'Manual', 'Bensin', 22000, 128000000, '2026-11-01', 'Tersedia', 'Z 1093 HR', 'Low kilometer 22rb asli, pajak panjang sampai Oktober 2027, siap pakai tanpa PR.'),
('STK-2026-005', 'Honda', 'HR-V 1.5 E CVT', 2019, 'Putih', 'CVT', 'Bensin', 52000, 245000000, '2026-07-20', 'Terjual', 'D 1205 HRV', 'Sudah terjual ke Bapak Rahmat Hidayat akhir Agustus 2026.'),
('STK-2026-006', 'Suzuki', 'Ertiga GL M/T', 2020, 'Silver Metalik', 'Manual', 'Bensin', 41000, 168000000, '2026-10-15', 'Tersedia', 'Z 1572 SG', 'Kabin lega dan nyaman, mesin K15B bensin terkenal irit, interior orisinil bludru pabrik.'),
('STK-2026-007', 'Toyota', 'Fortuner 2.4 VRZ A/T Diesel', 2020, 'Hitam', 'Otomatis', 'Diesel', 49000, 435000000, '2026-05-10', 'Terjual', 'Z 1999 VRZ', 'Unit sudah laku terjual ke konsumen Tasikmalaya.'),
('STK-2026-008', 'Daihatsu', 'Terios R Custom A/T', 2021, 'Putih', 'Otomatis', 'Bensin', 39000, 215000000, '2026-08-01', 'Tidak Aktif', 'D 1642 TRS', 'Sedang salon detail coating & penggantian karet wiper.')
ON CONFLICT (id) DO NOTHING;

-- 3. Pelanggan Showroom Garut
INSERT INTO public.customers (id, full_name, whatsapp, email, address, district, source, interested_vehicle, vehicle_type, budget, status, registered_date) VALUES
('CUST-2026-001', 'Agus Gunawan', '081221345678', 'agus.gunawan@gmail.com', 'Jl. Cimanuk No. 45, RT 02/05', 'Tarogong Kidul', 'Walk-in', 'Toyota Innova Reborn 2.4 G A/T Diesel 2020', 'MPV', 330000000, 'Sudah Beli', '2026-01-15'),
('CUST-2026-002', 'Siti Rahmawati, S.Pd.', '085223456789', 'siti.rahma@yahoo.com', 'Perumahan Jayaraga Indah Blok C-12', 'Tarogong Kidul', 'Instagram', 'Honda HR-V 1.5 E CVT 2019', 'SUV', 245000000, 'Sudah Beli', '2026-01-20'),
('CUST-2026-003', 'Dadan Ramdani', '081394567890', 'dadan.ramdani88@gmail.com', 'Kp. Cimuncang RT 01/RW 03, Samarang', 'Samarang', 'WhatsApp', 'Mitsubishi Xpander Ultimate 2021', 'MPV', 225000000, 'Aktif', '2026-02-05'),
('CUST-2026-004', 'Wawan Hermawan', '085712348899', 'wawan.h@gmail.com', 'Jl. Merdeka No. 89, Tarogong Kaler', 'Tarogong Kaler', 'Walk-in', 'Toyota Avanza 1.3 G M/T 2019', 'MPV', 165000000, 'Sudah Beli', '2025-11-01'),
('CUST-2026-005', 'Yudi Karyadi', '087823451122', 'yudi.karyadi@outlook.com', 'Jl. Pembangunan No. 102, Garut Kota', 'Garut Kota', 'Facebook', 'Daihatsu Terios R Deluxe 2020', 'SUV', 195000000, 'Sudah Beli', '2026-08-15'),
('CUST-2026-006', 'Hj. Neneng Hasanah', '082119876543', 'hj.neneng@gmail.com', 'Jl. Raya Bayongbong Km 8', 'Bayongbong', 'Walk-in', 'Honda Brio Satya E CVT 2021', 'City Car', 145000000, 'Aktif', '2026-02-18')
ON CONFLICT (id) DO NOTHING;

-- 4. Prospek (Leads) & Preferensi Pencarian Unit
INSERT INTO public.leads (id, customer_name, contact_number, lead_source, interested_vehicle, vehicle_type, estimated_budget, status, search_brand, search_model, search_year_min, search_year_max, search_budget_max, notes) VALUES
('LEAD-2026-001', 'Budi Santoso', '081223344556', 'WhatsApp', 'Toyota Avanza Veloz 1.5 A/T 2021', 'MPV', 210000000, 'Cek Unit', 'Toyota', 'Avanza', 2020, 2022, 220000000, 'Tertarik dengan warna putih atau hitam metalik.'),
('LEAD-2026-002', 'Maya Kartika', '085624112233', 'Instagram', 'Honda Brio Satya E CVT 2021', 'City Car', 148000000, 'Negosiasi', 'Honda', 'Brio', 2020, 2022, 150000000, 'Tawar menawar DP kredit.'),
('LEAD-2026-003', 'Andi Setiawan', '081298765432', 'Walk-in', 'Toyota Avanza G M/T 2020', 'MPV', 180000000, 'Tertarik', 'Toyota', 'Avanza', 2019, 2021, 185000000, 'Mencari Avanza manual untuk usaha keluarga.')
ON CONFLICT (id) DO NOTHING;

-- 5. Follow-ups
INSERT INTO public.follow_ups (id, customer_name, customer_phone, vehicle_info, category, follow_up_reason, scheduled_date, scheduled_time, channel, status, priority, notes) VALUES
('FLW-2026-001', 'Wawan Hermawan', '085712348899', 'Toyota Avanza 1.3 G M/T 2019', 'Pelanggan Lama (1 Tahun)', 'Menanyakan kondisi kendaraan setelah 1 tahun pemakaian dan opsi tukar tambah.', CURRENT_DATE, '10:00:00', 'WhatsApp', 'Belum Dihubungi', 'Sedang', 'Konsumen loyal HR MOTOR cabang Tarogong.'),
('FLW-2026-002', 'Dadan Ramdani', '081394567890', 'Mitsubishi Xpander Ultimate 2021', 'Prospek Tidak Jadi (1 Bulan)', 'Menanyakan apakah masih mencari unit mobil keluarga.', CURRENT_DATE, '11:00:00', 'WhatsApp', 'Belum Dihubungi', 'Tinggi', 'Sempat mundur karena harga belum cocok bulan lalu.'),
('FLW-2026-003', 'Andi Setiawan', '081298765432', 'Toyota Avanza 1.3 G M/T (2020) - Rp 178.000.000', 'Unit yang Dicari Sudah Tersedia', 'Unit Avanza 2020 baru masuk stok showroom HR MOTOR.', CURRENT_DATE, '09:00:00', 'WhatsApp', 'Belum Dihubungi', 'Tinggi', 'Sistem mencocokkan stok Avanza STK-2026-001 dengan kebutuhan calon pembeli.')
ON CONFLICT (id) DO NOTHING;

-- 6. Riwayat Perbaikan Garansi (Riwayat Perbaikan Garansi)
INSERT INTO public.repair_claims (id, claim_number, customer_name, customer_phone, vehicle_brand, vehicle_model, vehicle_year, purchase_date, claim_date, claim_type, complaint_or_damage, parts_to_repair, damage_category, repair_action_description, sparepart_cost, service_cost, total_cost, status, notes) VALUES
('RPR-2026-001', 'GRS-2026-001', 'Agus Gunawan', '081221345678', 'Toyota', 'Innova Reborn 2.4 G A/T Diesel', 2020, '2026-09-12', '2026-09-25', 'Garansi', 'Indikator check engine menyala sesaat dan tarikan bawah agak berat', 'Sensor aliran udara MAF & filter solar', 'Mesin', 'Pembersihan sensor MAF dan penggantian filter solar orisinil Toyota', 350000, 150000, 500000, 'Selesai', 'Garansi 1 bulan pasca pembelian. Klaim disetujui dan ditangani tuntas.'),
('RPR-2026-002', 'GRS-2026-002', 'Siti Rahmawati, S.Pd.', '085223456789', 'Honda', 'HR-V 1.5 E CVT', 2019, '2026-09-18', '2026-10-05', 'Garansi', 'AC kurang dingin saat siang hari dan bunyi desis halus', 'Filter kabin AC, magnetic clutch, freon R134a', 'Kelistrikan & AC', 'Penggantian filter kabin, setel celah magnetic clutch, dan isi ulang freon', 550000, 250000, 800000, 'Selesai', 'Garansi AC pasca pembelian berjalan lancar.'),
('RPR-2026-003', 'GRS-2026-003', 'Yudi Karyadi', '087823451122', 'Mitsubishi', 'Xpander Ultimate A/T', 2021, '2026-08-15', '2026-10-12', 'Non-Garansi', 'Bumper depan sisi kiri lecet tergores pagar rumah saat parkir', 'Bumper depan sisi kiri & klip kancing', 'Bodi & Cat', 'Perbaikan dempul tipis, cat oven sewarna bodi, dan poles', 150000, 650000, 800000, 'Selesai', 'Layanan rekanan bengkel bodi HR MOTOR untuk pelanggan setia.')
ON CONFLICT (id) DO NOTHING;

-- 7. Transaksi Pembelian (Deal)
INSERT INTO public.customer_purchases (id, customer_id, customer_name, vehicle_brand, vehicle_model, vehicle_year, plate_number, color, mileage_km, purchase_price, payment_method, purchase_date, warranty_until, sales_name, notes) VALUES
('DEAL-2026-001', 'CUST-2026-001', 'Agus Gunawan', 'Toyota', 'Innova Reborn 2.4 G A/T Diesel', 2020, 'Z 1452 DA', 'Hitam Metalik', 52000, 325000000, 'Cash Keras', '2026-09-12', '2026-10-12', 'Asep Kurniawan', 'Transaksi lunas, surat-surat BPKB dan faktur lengkap diserahkan.'),
('DEAL-2026-002', 'CUST-2026-002', 'Siti Rahmawati, S.Pd.', 'Honda', 'HR-V 1.5 E CVT', 2019, 'D 1205 HRV', 'Putih Mutiara', 48000, 240000000, 'Kredit BCA Finance', '2026-09-18', '2026-10-18', 'Rina Sulaeman', 'Persetujuan kredit BCA Finance lancar, DP 30%.')
ON CONFLICT (id) DO NOTHING;
