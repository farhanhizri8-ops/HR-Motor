const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createPresentation() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pres.author = 'HR MOTOR Garut';
  pres.company = 'Showroom HR MOTOR';
  pres.title = 'Sistem CRM Terpadu HR MOTOR Garut';

  const logoPath = path.resolve(__dirname, '../public/emblem-transparent.png');
  const hasLogo = fs.existsSync(logoPath);

  // PALETTE
  const DARK_BG = '18181B';      // Charcoal Dark
  const LIGHT_BG = 'F8F7F4';     // Warm Light Cream
  const WHITE = 'FFFFFF';
  const GOLD = 'D97706';         // HR MOTOR Gold
  const GOLD_LIGHT = 'FDE68A';
  const TEXT_DARK = '1E293B';
  const TEXT_MUTED = '64748B';
  const CARD_BG = 'FFFFFF';
  const CARD_BORDER = 'E2E8F0';
  const EMERALD = '059669';
  const INDIGO = '4F46E5';
  const ROSE = 'E11D48';

  // HELPER: Header on content slides
  function addSlideHeader(slide, category, title, subtitle) {
    // Top bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.1,
      fill: { color: GOLD }
    });

    // Category badge
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.35, w: 7.5, h: 0.25,
      fontSize: 9, bold: true, color: GOLD, fontFace: 'Arial',
      charSpacing: 2
    });

    // Title
    slide.addText(title, {
      x: 0.8, y: 0.6, w: 7.5, h: 0.45,
      fontSize: 20, bold: true, color: TEXT_DARK, fontFace: 'Arial'
    });

    // Subtitle
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.05, w: 8.4, h: 0.3,
        fontSize: 11, color: TEXT_MUTED, fontFace: 'Arial'
      });
    }

    // Small logo watermark on top right
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 8.7, y: 0.35, w: 0.7, h: 0.7
      });
    }

    // Bottom footer bar
    slide.addText('HR MOTOR GARUT • SISTEM CRM DEALERSHIP', {
      x: 0.8, y: 5.25, w: 6.0, h: 0.25,
      fontSize: 8, color: '94A3B8', fontFace: 'Arial'
    });
  }

  // ==========================================
  // SLIDE 1: JUDUL DI AWAL (TITLE SLIDE)
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: DARK_BG };

    // Decorative top-right gold accent
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.15,
      fill: { color: GOLD }
    });

    // Logo Center
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 4.3, y: 0.8, w: 1.4, h: 1.4
      });
    }

    // Tagline Badge
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 3.2, y: 2.35, w: 3.6, h: 0.32, rectRadius: 0.1,
      fill: { color: '27272A' },
      line: { color: GOLD, width: 1 }
    });
    slide.addText('SISTEM CRM SHOWROOM RESMI', {
      x: 3.2, y: 2.35, w: 3.6, h: 0.32,
      fontSize: 9, bold: true, color: GOLD_LIGHT, align: 'center', fontFace: 'Arial',
      charSpacing: 2
    });

    // Main Title
    slide.addText('SISTEM CRM TERPADU\nHR MOTOR GARUT', {
      x: 1.0, y: 2.8, w: 8.0, h: 1.2,
      fontSize: 28, bold: true, color: WHITE, align: 'center', fontFace: 'Arial',
      lineSpacing: 34
    });

    // Subtitle
    slide.addText('Otomasi Manajemen Pelanggan, Transaksi Cash & Kredit, Serta Pipeline Penjualan Showroom Mobil Bekas', {
      x: 1.5, y: 4.1, w: 7.0, h: 0.5,
      fontSize: 12, color: 'CBD5E1', align: 'center', fontFace: 'Arial'
    });

    // Bottom Meta
    slide.addText('Showroom Mobil Bekas Berkualitas • Garut, Jawa Barat\nVersi Digital Showroom 2.0', {
      x: 2.0, y: 4.8, w: 6.0, h: 0.45,
      fontSize: 9, color: '71717A', align: 'center', fontFace: 'Arial'
    });
  }

  // ==========================================
  // SLIDE 2: LATAR BELAKANG & TRANSFORMASI CRM
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Latar Belakang & Transformasi Digital',
      'Tantangan Operasional Showroom & Solusi CRM Terpadu',
      'Bagaimana HR MOTOR bertransformasi dari sistem manual menjadi showroom modern berbasis data'
    );

    // Left Card: Sebelum CRM
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.5, w: 4.0, h: 3.5, rectRadius: 0.15,
      fill: { color: WHITE },
      line: { color: 'FECDD3', width: 1.5 }
    });
    slide.addText('TANTANGAN SEBELUM CRM', {
      x: 1.1, y: 1.7, w: 3.4, h: 0.3,
      fontSize: 12, bold: true, color: ROSE, fontFace: 'Arial'
    });
    const problems = [
      'Pencatatan calon pembeli di buku / kertas rentan hilang dan sulit dicari kembali.',
      'Jadwal follow-up prospek sering terlupakan sehingga konsumen membeli di showroom lain.',
      'Status pengajuan kredit leasing (ACC / Tolak) simpang siur dan lambat dikonfirmasi.',
      'Mobil yang sudah dibooking rawan terjual ganda karena tidak ada sinkronisasi stok.'
    ];
    let py = 2.1;
    problems.forEach((p) => {
      slide.addText('• ' + p, {
        x: 1.1, y: py, w: 3.4, h: 0.65,
        fontSize: 10, color: TEXT_DARK, fontFace: 'Arial'
      });
      py += 0.68;
    });

    // Right Card: Solusi CRM HR MOTOR
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.2, y: 1.5, w: 4.0, h: 3.5, rectRadius: 0.15,
      fill: { color: WHITE },
      line: { color: 'A7F3D0', width: 1.5 }
    });
    slide.addText('SOLUSI SISTEM CRM HR MOTOR', {
      x: 5.5, y: 1.7, w: 3.4, h: 0.3,
      fontSize: 12, bold: true, color: EMERALD, fontFace: 'Arial'
    });
    const solutions = [
      'Database pelanggan digital terpusat, aman, dan mudah diakses dari HP maupun laptop.',
      'Notifikasi otomatis follow-up konsumen berkala (1, 3, 6 bulan, 1 tahun).',
      'Tabel khusus Menunggu ACC & Kredit Ditolak memisahkan calon dari pelanggan resmi.',
      'Sistem booking unit otomatis mengunci stok mobil agar tidak bisa dijual ganda.'
    ];
    let sy = 2.1;
    solutions.forEach((s) => {
      slide.addText('✓ ' + s, {
        x: 5.5, y: sy, w: 3.4, h: 0.65,
        fontSize: 10, color: TEXT_DARK, fontFace: 'Arial'
      });
      sy += 0.68;
    });
  }

  // ==========================================
  // SLIDE 3: 4 PILAR UTAMA EKOSISTEM CRM
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Arsitektur Solusi',
      '4 Pilar Utama Ekosistem CRM HR MOTOR Garut',
      'Struktur fondasi aplikasi yang dirancang khusus untuk operasional showroom mobil bekas'
    );

    const pillars = [
      {
        num: '01',
        title: 'Lead & Pipeline',
        desc: 'Merekam setiap prospek masuk dari WhatsApp, Walk-in, dan Medsos dengan 3 tahap pipeline terukur.',
        color: GOLD
      },
      {
        num: '02',
        title: 'Smart Unit Matching',
        desc: 'Mencocokkan kriteria mobil idaman pembeli dengan stok unit ready di showroom secara instan.',
        color: INDIGO
      },
      {
        num: '03',
        title: 'Transaksi & Pembiayaan',
        desc: 'Manajemen transaksi cash lunas, booking pengajuan kredit, persetujuan ACC, hingga kwitansi kasir.',
        color: EMERALD
      },
      {
        num: '04',
        title: 'Retensi & After-Sales',
        desc: 'Pengingat berkala follow-up konsumen untuk kepuasan berkendara, servis, dan peluang tukar tambah.',
        color: '0284C7'
      }
    ];

    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 2.15;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.6, w: 2.05, h: 3.3, rectRadius: 0.12,
        fill: { color: WHITE },
        line: { color: CARD_BORDER, width: 1 }
      });

      // Top colored accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x: x, y: 1.6, w: 2.05, h: 0.08,
        fill: { color: p.color }
      });

      // Number badge
      slide.addText(p.num, {
        x: x + 0.15, y: 1.8, w: 1.75, h: 0.4,
        fontSize: 22, bold: true, color: p.color, fontFace: 'Arial'
      });

      // Pillar Title
      slide.addText(p.title, {
        x: x + 0.15, y: 2.25, w: 1.75, h: 0.5,
        fontSize: 12, bold: true, color: TEXT_DARK, fontFace: 'Arial'
      });

      // Pillar Desc
      slide.addText(p.desc, {
        x: x + 0.15, y: 2.8, w: 1.75, h: 1.9,
        fontSize: 9.5, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 14
      });
    });
  }

  // ==========================================
  // SLIDE 4: PIPELINE PENJUALAN 3 TAHAP
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Manajemen Prospek',
      'Pipeline Penjualan 3 Tahap (Sales Conversion Funnel)',
      'Memantau perjalanan calon pembeli dari sekadar tanya-tanya hingga deal transaksi'
    );

    const stages = [
      {
        step: 'TAHAP 1',
        name: 'Hanya Menanyakan',
        icon: '💬',
        desc: 'Calon pembeli mencari info unit, rentang harga, simulasi kredit, atau menanyakan unit yang akan masuk.',
        action: 'Tindakan: Catat budget, model unit yang dicari, dan nomor WhatsApp.'
      },
      {
        step: 'TAHAP 2',
        name: 'Negosiasi',
        icon: '🤝',
        desc: 'Konsumen telah mengerucut pada 1 atau 2 pilihan unit. Proses tawar harga, besaran DP, atau skema kredit.',
        action: 'Tindakan: Buat simulasi angsuran, berikan penawaran harga terbaik showroom.'
      },
      {
        step: 'TAHAP 3',
        name: 'Cek Unit',
        icon: '🚗',
        desc: 'Konsumen datang langsung ke showroom untuk test drive, cek kelengkapan dokumen, dan kondisi fisik mesin.',
        action: 'Tindakan: Siapkan unit di showroom, pendampingan test drive, dan closing deal.'
      }
    ];

    stages.forEach((st, idx) => {
      const x = 0.8 + idx * 2.9;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.6, w: 2.7, h: 3.3, rectRadius: 0.12,
        fill: { color: WHITE },
        line: { color: CARD_BORDER, width: 1 }
      });

      // Badge Stage
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.2, y: 1.8, w: 1.2, h: 0.28, rectRadius: 0.08,
        fill: { color: 'FEF3C7' }
      });
      slide.addText(st.step, {
        x: x + 0.2, y: 1.8, w: 1.2, h: 0.28,
        fontSize: 9, bold: true, color: GOLD, align: 'center', fontFace: 'Arial'
      });

      // Stage Name
      slide.addText(st.name, {
        x: x + 0.2, y: 2.2, w: 2.3, h: 0.45,
        fontSize: 14, bold: true, color: TEXT_DARK, fontFace: 'Arial'
      });

      // Description
      slide.addText(st.desc, {
        x: x + 0.2, y: 2.7, w: 2.3, h: 1.1,
        fontSize: 9.5, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 14
      });

      // Action box
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.15, y: 3.85, w: 2.4, h: 0.9, rectRadius: 0.08,
        fill: { color: 'F1F5F9' }
      });
      slide.addText(st.action, {
        x: x + 0.25, y: 3.9, w: 2.2, h: 0.8,
        fontSize: 8.5, bold: true, color: '334155', fontFace: 'Arial'
      });
    });
  }

  // ==========================================
  // SLIDE 5: SMART MATCHING SYSTEM
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Fitur Cerdas CRM',
      'Smart Matching: Kebutuhan Konsumen vs Stok Showroom',
      'Algoritma cerdas yang menjodohkan keinginan calon pembeli dengan stok mobil yang tersedia'
    );

    // Left Box: Ilustrasi Cara Kerja
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.55, w: 4.1, h: 3.4, rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: CARD_BORDER, width: 1 }
    });
    slide.addText('CARA KERJA SMART MATCHING', {
      x: 1.05, y: 1.75, w: 3.6, h: 0.3,
      fontSize: 12, bold: true, color: INDIGO, fontFace: 'Arial'
    });
    const matchSteps = [
      '1. Konsumen Mencari: Sales mencatat brand, model, transmisi (Matic/Manual), budget maks, dan tahun minimal yang dicari konsumen.',
      '2. Deteksi Cerdas: Algoritma memeriksa seluruh mobil ready di showroom secara multi-atribut tanpa salah rekomendasi varian.',
      '3. Rekomendasi Instan: Jika ada mobil cocok, tim sales dapat langsung menawarkannya dalam hitungan detik.',
      '4. Notifikasi Unit Baru: Saat ada mobil baru masuk showroom yang cocok dengan pencarian konsumen lama, sistem segera memberitahu sales.'
    ];
    let my = 2.15;
    matchSteps.forEach((m) => {
      slide.addText(m, {
        x: 1.05, y: my, w: 3.6, h: 0.65,
        fontSize: 9.5, color: TEXT_DARK, fontFace: 'Arial'
      });
      my += 0.68;
    });

    // Right Box: Keunggulan bagi Showroom
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.1, y: 1.55, w: 4.1, h: 3.4, rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: CARD_BORDER, width: 1 }
    });
    slide.addText('MANFAAT BISNIS SHOWROOM', {
      x: 5.35, y: 1.75, w: 3.6, h: 0.3,
      fontSize: 12, bold: true, color: GOLD, fontFace: 'Arial'
    });

    const benefits = [
      { title: 'Perputaran Stok Cepat', desc: 'Mobil yang baru masuk bisa langsung ditawarkan ke calon pembeli yang sudah menunggu unit tersebut.' },
      { title: 'Tingkat Konversi Tinggi', desc: 'Konsumen merasa diprioritaskan karena showroom mengingat preferensi mobil idaman mereka.' },
      { title: 'Mencegah Prospek Kabur', desc: 'Konsumen tidak perlu beralih ke dealer lain karena HR MOTOR sigap mencarikan unit yang diinginkan.' }
    ];
    let by = 2.15;
    benefits.forEach((b) => {
      slide.addText('★ ' + b.title, {
        x: 5.35, y: by, w: 3.6, h: 0.25,
        fontSize: 10.5, bold: true, color: TEXT_DARK, fontFace: 'Arial'
      });
      slide.addText(b.desc, {
        x: 5.55, y: by + 0.25, w: 3.4, h: 0.55,
        fontSize: 9, color: TEXT_MUTED, fontFace: 'Arial'
      });
      by += 0.85;
    });
  }

  // ==========================================
  // SLIDE 6: MANAJEMEN TRANSAKSI CASH
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Otomasi Transaksi',
      'Manajemen Transaksi Cash & Integrasi Pelanggan',
      'Pencatatan penjualan tunai langsung masuk ke database resmi pelanggan dan menerbitkan kwitansi'
    );

    const cashSteps = [
      {
        step: '1',
        title: 'Input Transaksi Cash',
        desc: 'Sales memasukkan nama pembeli, nomor WA, alamat, unit mobil, dan harga kesepakatan deal.'
      },
      {
        step: '2',
        title: 'Update Stok Showroom',
        desc: 'Unit mobil otomatis berganti status menjadi "Terjual (SOLD OUT)" dan tercatat nama pembeli.'
      },
      {
        step: '3',
        title: 'Otomatis Masuk Data Pelanggan',
        desc: 'Data konsumen langsung tersimpan di Tabel Data Pelanggan sebagai pembeli sah resmi showroom.'
      },
      {
        step: '4',
        title: 'Cetak Kwitansi Kasir',
        desc: 'Sistem langsung menerbitkan kwitansi resmi HR MOTOR lengkap dengan nominal terbilang rupiah.'
      }
    ];

    cashSteps.forEach((cs, idx) => {
      const x = 0.8 + idx * 2.15;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.65, w: 2.05, h: 2.5, rectRadius: 0.12,
        fill: { color: WHITE },
        line: { color: 'A7F3D0', width: 1.5 }
      });

      slide.addShape(pres.shapes.OVAL, {
        x: x + 0.15, y: 1.85, w: 0.45, h: 0.45,
        fill: { color: EMERALD }
      });
      slide.addText(cs.step, {
        x: x + 0.15, y: 1.85, w: 0.45, h: 0.45,
        fontSize: 12, bold: true, color: WHITE, align: 'center', fontFace: 'Arial'
      });

      slide.addText(cs.title, {
        x: x + 0.15, y: 2.4, w: 1.75, h: 0.5,
        fontSize: 11, bold: true, color: TEXT_DARK, fontFace: 'Arial'
      });

      slide.addText(cs.desc, {
        x: x + 0.15, y: 2.95, w: 1.75, h: 1.1,
        fontSize: 9, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 13
      });
    });

    // Bottom Summary Banner
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.35, w: 8.4, h: 0.75, rectRadius: 0.1,
      fill: { color: 'ECFDF5' },
      line: { color: 'A7F3D0', width: 1 }
    });
    slide.addText('✓ Keuntungan Transaksi Cash CRM: Mengeliminasi rekap ganda antar kasir, riwayat uang masuk transparan, serta kwitansi kasir standar showroom dapat dicetak atau dikirim via PDF WhatsApp dalam 1 detik.', {
      x: 1.0, y: 4.45, w: 8.0, h: 0.55,
      fontSize: 9.5, bold: true, color: '065F46', fontFace: 'Arial'
    });
  }

  // ==========================================
  // SLIDE 7: PENGAJUAN KREDIT, ACC & DITOLAK
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Sistem Pembiayaan Leasing',
      'Alur Pengajuan Kredit, Menunggu ACC & Kredit Ditolak',
      'Mekanisme cerdas memisahkan calon pengajuan dari pembeli resmi agar data pelanggan tetap bersih'
    );

    // Box 1: Saat Pengajuan Baru
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.55, w: 2.7, h: 3.4, rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: 'FDE68A', width: 1.5 }
    });
    slide.addText('1. PENGAJUAN BARU', {
      x: 1.0, y: 1.75, w: 2.3, h: 0.3,
      fontSize: 11, bold: true, color: GOLD, fontFace: 'Arial'
    });
    slide.addText('• Mobil otomatis berstatus BOOKING (BOKING).\n• Unit dikunci agar tidak ditawar konsumen lain.\n• Data masuk ke Tabel Menunggu ACC.\n• Data TIDAK masuk ke Tabel Pelanggan.', {
      x: 1.0, y: 2.1, w: 2.3, h: 2.6,
      fontSize: 9.5, color: TEXT_DARK, fontFace: 'Arial', lineSpacing: 16
    });

    // Box 2: Jika Disetujui (ACC)
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 3.65, y: 1.55, w: 2.7, h: 3.4, rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: 'A7F3D0', width: 1.5 }
    });
    slide.addText('2. KREDIT DI-ACC', {
      x: 3.85, y: 1.75, w: 2.3, h: 0.3,
      fontSize: 11, bold: true, color: EMERALD, fontFace: 'Arial'
    });
    slide.addText('• Mobil resmi menjadi TERJUAL (SOLD OUT).\n• Data konsumen otomatis masuk ke Tabel Data Pelanggan.\n• Kwitansi resmi Uang Muka (DP) leasing langsung terbit.\n• Jadwal follow-up after sales aktif.', {
      x: 3.85, y: 2.1, w: 2.3, h: 2.6,
      fontSize: 9.5, color: TEXT_DARK, fontFace: 'Arial', lineSpacing: 16
    });

    // Box 3: Jika Ditolak Bank
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.5, y: 1.55, w: 2.7, h: 3.4, rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: 'FECDD3', width: 1.5 }
    });
    slide.addText('3. KREDIT DITOLAK', {
      x: 6.7, y: 1.75, w: 2.3, h: 0.3,
      fontSize: 11, bold: true, color: ROSE, fontFace: 'Arial'
    });
    slide.addText('• Mobil otomatis KEMBALI READY di showroom.\n• Unit bisa langsung ditawarkan ke calon pembeli lain.\n• Data masuk ke Tabel Kredit Ditolak beserta alasan bank.\n• Tabel Pelanggan tetap bersih.', {
      x: 6.7, y: 2.1, w: 2.3, h: 2.6,
      fontSize: 9.5, color: TEXT_DARK, fontFace: 'Arial', lineSpacing: 16
    });
  }

  // ==========================================
  // SLIDE 8: FOLLOW-UP RETENSI KONSUMEN
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Retensi & Loyalitas Pelanggan',
      'Follow-Up Konsumen Berkala & Hubungan Berkelanjutan',
      'Membangun kepuasan jangka panjang, layanan after-sales, dan peluang repeat order serta referral'
    );

    const milestones = [
      {
        time: '1 Bulan',
        title: 'Evaluasi Pemakaian Awal',
        desc: 'Menanyakan impresi kenyamanan berkendara, memastikan dokumen STNK/BPKB tuntas, dan kesiapan pemakaian.'
      },
      {
        time: '3 Bulan',
        title: 'Pengecekan Rutin',
        desc: 'Mengingatkan waktu ganti oli berkala, pemeriksaan rem & ban, serta memastikan kondisi mesin tetap prima.'
      },
      {
        time: '6 Bulan',
        title: 'Silaturahmi & Referral',
        desc: 'Menjaga kedekatan konsumen, meminta ulasan kepuasan, dan membuka peluang rekomendasi keluarga atau teman.'
      },
      {
        time: '1 Tahun',
        title: 'Peluang Trade-In',
        desc: 'Menawarkan program tukar tambah (upgrade) unit tahun lebih muda dengan skema cash maupun kredit istimewa.'
      }
    ];

    milestones.forEach((m, idx) => {
      const x = 0.8 + idx * 2.15;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.6, w: 2.05, h: 2.5, rectRadius: 0.12,
        fill: { color: WHITE },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.15, y: 1.8, w: 1.2, h: 0.3, rectRadius: 0.08,
        fill: { color: 'FEF3C7' }
      });
      slide.addText(m.time, {
        x: x + 0.15, y: 1.8, w: 1.2, h: 0.3,
        fontSize: 10, bold: true, color: GOLD, align: 'center', fontFace: 'Arial'
      });

      slide.addText(m.title, {
        x: x + 0.15, y: 2.25, w: 1.75, h: 0.5,
        fontSize: 11, bold: true, color: TEXT_DARK, fontFace: 'Arial'
      });

      slide.addText(m.desc, {
        x: x + 0.15, y: 2.8, w: 1.75, h: 1.2,
        fontSize: 9, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 13
      });
    });

    // WhatsApp Direct Integration
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.3, w: 8.4, h: 0.8, rectRadius: 0.1,
      fill: { color: WHITE },
      line: { color: 'A7F3D0', width: 1.5 }
    });
    slide.addText('📲 Integrasi WhatsApp 1-Klik: Sales cukup klik tombol WhatsApp di sistem CRM, pesan sapaan personal otomatis terbuat dengan menyebut nama konsumen dan mobil yang dibeli, tanpa perlu mengetik manual.', {
      x: 1.0, y: 4.4, w: 8.0, h: 0.6,
      fontSize: 9.5, color: '065F46', bold: true, fontFace: 'Arial'
    });
  }

  // ==========================================
  // SLIDE 9: DASHBOARD ANALITIK & KINERJA BISNIS
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: LIGHT_BG };
    addSlideHeader(
      slide,
      'Monitoring & Analisis',
      'Dashboard Analitik CRM & Kinerja Bisnis Showroom',
      'Visibilitas penuh performa showroom secara real-time di layar laptop maupun smartphone'
    );

    const kpis = [
      { label: 'Total Unit Terjual (Sold Out)', val: 'Cash + Kredit Deal', sub: 'Omzet Penjualan Akurat', color: GOLD },
      { label: 'Penjualan Cash Keras', val: 'Lunas & Terima Kwitansi', sub: 'Cash Flow Masuk Cepat', color: EMERALD },
      { label: 'Penjualan Kredit (Leasing)', val: 'BCA, MUF, Adira, Mandiri', sub: 'Distribusi Bank Terpantau', color: INDIGO },
      { label: 'Tingkat Respon Follow-Up', val: 'Monitoring Prospek & Beli', sub: 'Mencegah Pelanggan Lost', color: '0284C7' }
    ];

    kpis.forEach((k, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 4.3;
      const y = 1.6 + row * 1.4;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x, y: y, w: 4.1, h: 1.25, rectRadius: 0.12,
        fill: { color: WHITE },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addShape(pres.shapes.RECTANGLE, {
        x: x, y: y, w: 0.08, h: 1.25,
        fill: { color: k.color }
      });

      slide.addText(k.label.toUpperCase(), {
        x: x + 0.25, y: y + 0.15, w: 3.7, h: 0.25,
        fontSize: 8.5, bold: true, color: TEXT_MUTED, fontFace: 'Arial'
      });

      slide.addText(k.val, {
        x: x + 0.25, y: y + 0.4, w: 3.7, h: 0.4,
        fontSize: 14, bold: true, color: TEXT_DARK, fontFace: 'Arial'
      });

      slide.addText(k.sub, {
        x: x + 0.25, y: y + 0.82, w: 3.7, h: 0.25,
        fontSize: 9, color: k.color, bold: true, fontFace: 'Arial'
      });
    });

    // Mobile Optimization Note
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.45, w: 8.4, h: 0.65, rectRadius: 0.1,
      fill: { color: 'F1F5F9' }
    });
    slide.addText('📱 Responsif 100% Mobile: Seluruh dashboard dan tabel dirancang ramah layar HP (cukup digulir vertikal ke bawah tanpa perlu geser ke samping atau zoom layar).', {
      x: 1.0, y: 4.52, w: 8.0, h: 0.5,
      fontSize: 9, color: '334155', bold: true, fontFace: 'Arial'
    });
  }

  // ==========================================
  // SLIDE 10: PENUTUP & TERIMAKASIH (CLOSING SLIDE)
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: DARK_BG };

    // Decorative top accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.15,
      fill: { color: GOLD }
    });

    // Logo Center
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 4.3, y: 0.9, w: 1.4, h: 1.4
      });
    }

    // Main Thanks Heading
    slide.addText('TERIMA KASIH', {
      x: 1.0, y: 2.5, w: 8.0, h: 0.7,
      fontSize: 34, bold: true, color: WHITE, align: 'center', fontFace: 'Arial',
      charSpacing: 2
    });

    // Subtitle Slogan
    slide.addText('HR MOTOR GARUT', {
      x: 1.0, y: 3.25, w: 8.0, h: 0.4,
      fontSize: 14, bold: true, color: GOLD, align: 'center', fontFace: 'Arial',
      charSpacing: 3
    });

    slide.addText('Solusi Sistem Manajemen Showroom Mobil Bekas Berkualitas, Transparan, & Terpercaya', {
      x: 1.5, y: 3.75, w: 7.0, h: 0.5,
      fontSize: 11, color: 'CBD5E1', align: 'center', fontFace: 'Arial'
    });

    // Contact info footer card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 2.5, y: 4.4, w: 5.0, h: 0.65, rectRadius: 0.1,
      fill: { color: '27272A' },
      line: { color: GOLD, width: 0.8 }
    });
    slide.addText('Showroom: Garut, Jawa Barat • Web: hr-motor.vercel.app', {
      x: 2.5, y: 4.52, w: 5.0, h: 0.4,
      fontSize: 10, color: GOLD_LIGHT, align: 'center', bold: true, fontFace: 'Arial'
    });
  }

  // SAVE FILE
  const outputPath = path.resolve(__dirname, '../public/HR_MOTOR_CRM_Presentation.pptx');
  const projectRootPath = path.resolve(__dirname, '../HR_MOTOR_CRM_Presentation.pptx');

  await pres.writeFile({ fileName: outputPath });
  fs.copyFileSync(outputPath, projectRootPath);

  console.log('✅ SUCCESS: Presentation created at:');
  console.log('  1. ' + outputPath);
  console.log('  2. ' + projectRootPath);
}

createPresentation().catch((err) => {
  console.error('❌ Error generating presentation:', err);
  process.exit(1);
});
