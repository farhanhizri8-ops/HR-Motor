# HR MOTOR CRM — Aplikasi Customer Relationship Management Showroom Mobil Bekas Garut

Aplikasi web **Customer Relationship Management (CRM)** terpadu, profesional, dan siap produksi yang dibangun khusus untuk **HR MOTOR**, showroom dealer mobil bekas berkualitas di Garut, Jawa Barat, Indonesia.

Proyek ini dirancang sebagai implementasi nyata sistem informasi CRM untuk studi kasus perguruan tinggi / proyek universitas, dengan fokus penuh dan murni pada **Customer Relationship Management (CRM)** — mengoptimalkan relasi konsumen, konversi prospek penjualan, follow-up berkala, komunikasi WhatsApp, retensi purna jual (after-sales), serta analitik kinerja penjualan, **BUKAN ERP** (tidak memuat modul akuntansi umum, payroll, bengkel umum, atau absensi karyawan).

---

## 🚗 IDENTITAS APLIKASI & SHOWROOM

- **Nama Aplikasi:** HR MOTOR CRM
- **Dealer / Perusahaan:** HR MOTOR Garut
- **Jenis Usaha:** Showroom Penjualan Mobil Bekas Berkualitas & Bergaransi Resmi
- **Lokasi Showroom:** Garut, Jawa Barat
- **Bahasa Antarmuka:** Bahasa Indonesia
- **Mata Uang:** Rupiah Indonesia (Rp)
- **Zona Waktu:** Asia/Jakarta (WIB)
- **Desain Tema:** Enterprise Automotive Theme (Dark Navy, Charcoal, Crisp White, Subtle Emerald Green Accents).

---

## ⚡ TEKNOLOGI UTAMA (TECH STACK)

1. **Framework:** Next.js 14 (App Router) & React 18
2. **Bahasa Pemrograman:** TypeScript (Full Type-Safety)
3. **Desain Sistem & Styling:** Tailwind CSS dengan kustomisasi tema otomotif HR MOTOR
4. **Ikonografi:** Lucide React Icons
5. **Visualisasi Data & Grafik:** Recharts (AreaChart, BarChart, PieChart)
6. **Ekspor Laporan:**
   - **Excel:** `xlsx` (lembar kerja multi-sheet terformat)
   - **PDF:** `jspdf` & `jspdf-autotable` (berkop surat resmi HR MOTOR Garut)
7. **Database & Persistensi:**
   - **Penyimpanan Lokal:** Engine penyimpanan persisten `/data/crm_store.json` (zero-config, langsung jalan tanpa setup pihak ketiga).
   - **Skrip Produksi Supabase PostgreSQL:** Berkas `supabase_schema.sql` lengkap dengan 13 tabel relasional, foreign keys, triggers, indexes, dan Row Level Security (RLS) policies.
8. **Keamanan & RBAC:** Autentikasi berbasis peran (Role-Based Access Control) dengan sistem persetujuan registrasi (Owner Approval).

---

## 📋 MODUL & FITUR LENGKAP APLIKASI

### 1. Dashboard Eksekutif CRM (`/`)
- **Kartu Metrik KPI Nyata (Dihitung Otomatis dari Database):**
  - Total Pelanggan Terdaftar
  - Pelanggan Baru Bulan Berjalan
  - Total Prospek Masuk & Prospek Aktif di Pipeline
  - Follow-up Hari Ini & Peringatan Follow-up Terlambat (Overdue Alert)
  - Total Deal Sukses & Nilai Transaksi Kumulatif (Rp)
  - Conversion Rate (%)
- **Filter Rentang Waktu Interaktif:**
  - Hari Ini, Minggu Ini, Bulan Ini, dan Kustom (Date Picker).
- **Grafik Interaktif Recharts:**
  - Tren Pertumbuhan Pelanggan & Prospek Bulanan (Area Chart)
  - Distribusi Saluran Prospek / Leads by Source (Pie Chart)
  - Distribusi Tahapan Sales Pipeline (Bar Chart)
  - Tren Efektivitas Konversi Bulanan / Win Rate (Bar Chart)
- **Widget Operasional Terpadu:**
  - Prospek Terbaru dengan tombol pintas WhatsApp Click-to-Chat
  - Jadwal Follow-up Mendatang & Terlambat
  - Transaksi Deal Sukses Terbaru (Unit, Harga, Plat Nomor Garut `Z`)
  - Jejak Aktivitas CRM Terkini (Live Audit Log)

### 2. Database Pelanggan (`/customers`)
- **Struktur Field Lengkap:**
  - ID Pelanggan otomatis (`CUST-2026-XXX`)
  - Nama Lengkap, Nomor WhatsApp, Email, Alamat, Kecamatan di Garut (Tarogong Kidul, Tarogong Kaler, Samarang, Kadungora, Limbangan, Cilawu, Karangpawitan, Leles, Wanaraja, Garut Kota).
  - Sumber Pelanggan, Unit & Jenis Mobil Diminati (MPV, SUV, City Car, Sedan, Commercial), Estimasi Budget (Rp), Sales Penanggung Jawab, Catatan Kebutuhan, Tanggal Pendaftaran, Status.
- **Fitur Validasi & Manajemen:**
  - **Deteksi Duplikasi Nomor WhatsApp Otomatis:** Mencegah input ganda untuk satu nomor kontak.
  - Tambah, Edit, dan Hapus Pelanggan dengan modal konfirmasi protektif.
  - Pencarian Cepat (Nama, No. WA, Alamat, Mobil) & Multi-Filter (Sumber, Sales PJ, Jenis Kendaraan, Status).
  - Pengurutan data (Berdasarkan Tanggal, Nama, atau Budget).
  - **Laci Detail Pelanggan (Customer Profile Drawer):**
    - Profil lengkap & tombol WhatsApp direct chat.
    - Riwayat Pembelian Unit Mobil (setelah transaksi deal).
    - Riwayat Interaksi & Percakapan Komunikasi.
    - Jadwal & Status Follow-up.

### 3. Leads Management / Manajemen Prospek (`/leads`)
- **Manajemen Sumber Calon Pembeli:**
  - Saluran: Facebook, Instagram, TikTok, WhatsApp, Walk-in Showroom, Referral, dan Lainnya.
- **Informasi Prospek:**
  - ID Prospek, Nama Calon Pembeli, No. WhatsApp, Estimasi Budget, Sales yang Ditugaskan, Tahapan Pipeline, Catatan Kebutuhan.
- **Aksi Cepat:**
  - Tombol WhatsApp Click-to-Chat langsung ke nomor prospek.
  - **Konversi ke Database Pelanggan:** Mengubah prospek menjadi data pelanggan resmi HR MOTOR hanya dengan 1 klik.
  - Penugasan sales representative (Sales Assignment).

### 4. Sales Pipeline / Pipa Penjualan Mobil (`/pipeline`)
- **Kanban Board Interaktif 7 Tahapan:**
  1. *Prospek Baru*
  2. *Sudah Dihubungi*
  3. *Tertarik*
  4. *Negosiasi*
  5. *Jadwal Test Drive*
  6. *Deal (Won)*
  7. *Lost (Gagal)*
- **Fitur Transisi Tahapan:**
  - Pemindahan kartu prospek dengan navigasi visual.
  - **Modal Negosiasi:** Mencatat poin penawaran harga dan paket bonus (kaca film, poles bodi).
  - **Modal Jadwal Test Drive:** Memilih tanggal, jam, dan lokasi (Showroom HR MOTOR Garut / Rumah Konsumen).
  - **Modal Deal:** Mencatat harga akhir, metode pembayaran (Cash Keras, BCA Finance, Mandiri Utama Finance, Adira Finance, OTO), plat nomor kendaraan (`Z XXXX HR`), dan otomatis membuat data purna jual di modul After Sales.
  - **Modal Lost:** Merekam kategori alasan kegagalan transaksi (Budget tidak sesuai, Membeli di showroom lain, Kredit ditolak leasing, dll.) untuk analisis evaluasi showroom.
  - Menampilkan umur prospek (*lead age*) dan tanggal kontak terakhir.

### 5. Follow-up Management / Manajemen Tindak Lanjut (`/follow-up`)
- **Tab Kategori Pintar:**
  - Follow-up Hari Ini
  - **Follow-up Terlambat (Overdue Alerts):** Disorot khusus dengan warna merah mencolok untuk mencegah prospek dingin.
  - Follow-up Mendatang
  - Riwayat Follow-up Selesai
- **Workflow Penyelesaian Interaktif:**
  - Mencatat hasil pembicaraan dengan konsumen.
  - Opsi instan untuk langsung menjadwalkan follow-up berikutnya dalam satu alur kerja.
  - Prioritas tindak lanjut: Tinggi (Hot), Sedang (Warm), Rendah (Cold).
  - Saluran: WhatsApp, Telepon Langsung, Kunjungan Dealer, Kunjungan Rumah.

### 6. Communication Center / Pusat Komunikasi (`/communication`)
- **Integrasi WhatsApp Click-to-Chat Resmi:**
  - Membuka percakapan WhatsApp secara langsung (`https://wa.me/...`) tanpa menyimpan kontak di ponsel.
- **Koleksi Template Pesan Standar HR MOTOR:**
  - *Sapaan Hangat Prospek Baru*
  - *Follow-up Penawaran & Undangan Showroom*
  - *Konfirmasi Jadwal Test Drive*
  - *Pengingat Berkas Pengajuan Kredit (Leasing)*
  - *Ucapan Selamat Deal & Penyerahan Unit Mobil*
  - *After-Sales Care (Kenyamanan Pasca 1 Bulan)*
- **Autofill Variabel Cerdas:** Otomatis mengisi nama konsumen dan mobil yang diminati ke dalam template.
- Pencatatan log percakapan (Kanal, Arah Masuk/Keluar, Waktu, Operator Sales).

### 7. After Sales & Customer Retention (`/after-sales`)
- **Daftar Mobil Terjual & Riwayat Transaksi:**
  - Merek, Model, Tahun, Nomor Polisi Garut (Plat Z), Warna, Jarak Tempuh (KM), Nilai Transaksi, Masa Berlaku Garansi Resmi HR MOTOR (1 Tahun).
- **Indeks Kepuasan Pelanggan (CSAT & NPS):**
  - Rating bintang 1-5, skor NPS (1-10), dan dokumentasi testimoni pembeli.
- **Manajemen Keluhan / Tiket Komplain Pelanggan:**
  - Nomor Tiket (`TIKET-GARUT-XXX`), kategori keluhan (Mesin & Transmisi, Kelistrikan & AC, Berkas STNK/BPKB, Aksesoris), tingkat prioritas (Darurat, Tinggi, Sedang, Rendah), dan status penyelesaian teknis.
- **Pelacakan Program Referral:**
  - Nama pemberi rekomendasi, prospek yang direferensikan, dan status pencairan reward komisi referral (Rp 1.500.000 / deal).

### 8. Reports & Analytics / Laporan Analitik CRM (`/reports`)
- **Analisis Mendalam:**
  - Kinerja Saluran Prospek (Lead Volume, Deal Conversion Rate, Total Omset per Sumber).
  - **Leaderboard Tim Sales Representative:** Peringkat tenaga penjual berdasarkan prospek ditangani, unit deal, rasio konversi, dan kepatuhan tindak lanjut follow-up.
  - **Analisis Alasan Prospek Lost:** Grafik penyebab pembatalan pembelian mobil bekas dan rekomendasi strategis perbaikan CRM showroom.
- **Ekspor Dokumen:**
  - **Ekspor Excel (.xlsx):** Multi-sheet (Ringkasan CRM, Database Pelanggan, Sales Pipeline, Kinerja Sales).
  - **Ekspor PDF Resmi:** Dokumen PDF berstandar cetak dengan kop surat resmi HR MOTOR Garut, tabel metrik, dan leaderboard staf.

### 9. User Management & Keamanan Hak Akses (`/users`)
- **Role-Based Access Control (RBAC):**
  - **Owner (Pemilik - H. Rahmat Hidayat):** Akses penuh seluruh modul, menyetujui registrasi akun baru, mengatur peran jabatan, melihat seluruh laporan dan audit trail.
  - **CRM Administrator:** Mengelola data pelanggan, prospek, follow-up, after sales, dan laporan.
  - **Sales Representative:** Mengelola data pelanggan dan prospek tugas pribadi, menggerakkan pipeline, menjadwalkan follow-up.
  - **WhatsApp Administrator:** Mengelola interaksi percakapan, template pesan, dan follow-up.
  - **Marketing:** Menganalisis efektivitas saluran prospek dan metrik konversi iklan.
- **Sistem Persetujuan Akun Baru (Owner Approval Queue):**
  - Pendaftaran staf baru wajib disetujui oleh akun Owner sebelum dapat mengakses modul CRM.
- **Demo Role Switcher:** Tombol cepat di header navigasi atas untuk berpindah sudut pandang akun (Owner vs Sales vs WA Admin) saat pengujian atau penilaian oleh dosen penguji.

### 10. Activity Logs / Jejak Audit (`/activity-logs`)
- Pencatatan seluruh aksi perubahan data penting secara otomatis (siapa pengguna, apa perannya, entitas yang diubah, waktu presisi WIB, dan detail perubahannya).

### 11. Pengaturan Dealer (`/settings`)
- Konfigurasi profil showroom, jam buka, kebijakan garansi resmi, dan tombol reset ke data awal demo.

---

## 🚀 CARA MENJALANKAN APLIKASI DI LOKAL

### Prasyarat:
- Node.js versi 18 ke atas (Node v20 atau v24 direkomendasikan).
- npm, pnpm, atau yarn.

### Langkah-langkah:
1. Masuk ke direktori proyek:
   ```bash
   cd hr-motor-crm
   ```

2. Instal dependensi (jika belum diinstal):
   ```bash
   npm install
   ```

3. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```

4. Buka peramban (browser) di alamat:
   ```
   http://localhost:3000
   ```

---

## 🗄️ SKEMA DATABASE SUPABASE POSTGRESQL

Jika ingin menghubungkan ke proyek Supabase cloud, skrip DDL SQL lengkap tersedia pada berkas:
`supabase_schema.sql`

Skrip ini memuat:
- Enum roles (`Owner`, `CRM Administrator`, `Sales Representative`, `WhatsApp Administrator`, `Marketing`)
- Tabel `crm_users`, `customers`, `leads`, `follow_ups`, `communications`, `customer_purchases`, `customer_feedback`, `customer_complaints`, `referrals`, `notifications`, dan `activity_logs`.
- Foreign key constraints, unique constraint nomor WhatsApp, dan index pencarian.
- Kebijakan Row Level Security (RLS) untuk perlindungan data pelanggan dan pemisahan hak akses staf.

---

## 👨‍🏫 PANDUAN DEMO UNTUK PENGUJI / PRESENTASI UNIVERSITAS

1. **Demonstrasi Dashboard:**
   - Tunjukkan kartu KPI utama. Semua angka berasal dari data aktual database showroom.
   - Ganti filter waktu (Hari Ini / Minggu Ini / Bulan Ini) untuk melihat reaktivitas filter data.
2. **Demonstrasi Deteksi Duplikasi WhatsApp:**
   - Masuk ke menu **Database Pelanggan**.
   - Coba tambahkan pelanggan baru dengan nomor WhatsApp yang sudah ada (contoh: `081221345678` atas nama Agus Gunawan). Sistem akan memblokir dan menampilkan peringatan nomor duplikat!
3. **Demonstrasi Sales Pipeline Kanban:**
   - Masuk ke menu **Sales Pipeline**.
   - Gerakkan prospek dari tahapan "Tertarik" ke "Negosiasi", lalu ke "Jadwal Test Drive", dan selesaikan ke tahap "Deal".
   - Perhatikan bahwa saat tahap "Deal" dipilih, sistem otomatis membuat rekam jejak After Sales!
4. **Demonstrasi WhatsApp Click-to-Chat:**
   - Masuk ke menu **Communication Center**.
   - Pilih pelanggan dan pilih salah satu template pesan resmi HR MOTOR. Klik tombol "Buka di WhatsApp" untuk melihat bagaimana format pesan dan nomor telepon otomatis terpasang tanpa klaim sinkronisasi palsu.
5. **Demonstrasi Hak Akses & Persetujuan Owner:**
   - Gunakan **Demo Role Switcher** di bagian atas navbar.
   - Pilih peran "Owner" dan buka menu **User Management**. Anda dapat melihat akun `Budi Santoso` yang berstatus *Menunggu Persetujuan Owner* dan tombol *Setujui Akun*.
   - Ganti peran ke "Sales Representative" dan perhatikan bahwa akses ke User Management otomatis disembunyikan sesuai hak akses jabatan.
6. **Demonstrasi Ekspor Laporan:**
   - Buka menu **Reports & Analytics**.
   - Klik **Ekspor Excel (.xlsx)** untuk mengunduh laporan multi-sheet lengkap.
   - Klik **Ekspor PDF Resmi** untuk mengunduh dokumen laporan resmi berkop surat HR MOTOR Garut.

---

**HR MOTOR Garut CRM** — Solusi Hubungan Pelanggan Terpercaya untuk Dealership Otomotif.
