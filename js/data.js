window.SIPK_DATA = {
  versi: 4,   // <- naikkan (3, 4, ...) setiap kali mengubah data ini

  /* ---------- AKUN PENGGUNA ----------
     peran : "admin" | "kasir" | "pemilik"
     aktif : false  -> akun ditolak saat login (untuk uji GAGAL)
     demo  : true   -> muncul sebagai tombol cepat di halaman login          */
  users: [
    { id: 1, nama: "Faka Auliansyah",             username: "admin",         password: "admin123",       peran: "admin",      aktif: true,  demo: true },
    { id: 3, nama: "Magalis Mifta",               username: "kasir",         password: "kasir123",       peran: "kasir",      aktif: true,  demo: true },
    { id: 4, nama: "Muhammad Rofi'",              username: "pemilik",       password: "pemilik123",     peran: "pemilik",    aktif: true,  demo: true },
    { id: 2, nama: "Nadya Paramesti Amirasyifa",  username: "operator",      password: "operator123",    peran: "operator",   aktif: true,  demo: true },
    { id: 5, nama: "Akun Nonaktif",               username: "nonaktif",      password: "nonaktif123",    peran: "kasir",      aktif: false, demo: false },
    // tambahkan akun baru di sini (id harus unik)
  ],


  /* ---------- KATEGORI BARANG ---------- */
  kategori: [
    { id: 1, nama: "Sembako" },
    { id: 2, nama: "Makanan & Camilan" },
    { id: 3, nama: "Minuman" },
    { id: 4, nama: "Perawatan Diri" },
    { id: 5, nama: "Kebutuhan Rumah" },
  ],

  /* ---------- BARANG ----------
     Format: [kode, nama, idKategori, hargaBeli, hargaJual, stok, stokMinimum]
     Tips uji: stok kecil (mis. 3) untuk menguji pesan "stok tidak tersedia".   */
  barang: [
    ["BRG001", "Beras Premium 5 kg",     1, 62000, 68000,  40, 10],
    ["BRG002", "Minyak Goreng 1 L",      1, 15500, 17500,  60, 15],
    ["BRG003", "Gula Pasir 1 kg",        1, 14000, 16000,  45, 10],
    ["BRG004", "Telur Ayam 1 kg",        1, 26000, 29000,  25,  8],
    ["BRG005", "Mi Instan Goreng",       2,  2800,  3500, 150, 30],
    ["BRG006", "Biskuit Cokelat 120 g",  2,  6500,  8000,   5, 10],   // stok menipis
    ["BRG007", "Roti Tawar",             2, 12000, 15000,  18,  6],
    ["BRG008", "Air Mineral 600 ml",     3,  2200,  3000, 200, 40],
    ["BRG009", "Teh Botol 450 ml",       3,  4000,  5500,  80, 20],
    ["BRG010", "Kopi Bubuk 200 g",       3, 13000, 16000,  30,  8],
    ["BRG011", "Susu UHT 250 ml",        3,  4800,  6000,   7, 12],   // stok menipis
    ["BRG012", "Sabun Mandi Batang",     4,  3000,  4000,  70, 15],
    ["BRG013", "Sampo Sachet",           4,   600,  1000, 120, 30],
    ["BRG014", "Deterjen Bubuk 800 g",   5, 17000, 20000,  22,  6],
    ["BRG015", "Pembersih Lantai 800 ml",5, 11000, 14000,  16,  5],
  ],

  /* ---------- TRANSAKSI CONTOH + KEUANGAN (3 tahun, dibuat otomatis oleh store.js) ----------
     hari          : jumlah hari ke belakang dari hari ini (1095 = 3 tahun)
     belumTerjual  : kode barang yang sengaja tidak pernah terjual -> bisa dihapus permanen (FR-02)
     musiman       : pengali jumlah transaksi per bulan (indeks 0 = Januari ... 11 = Desember)
     tumbuh        : kenaikan ramai pembeli dari awal ke akhir periode (0.25 = +25%)
     hargaAwal     : harga di awal periode = hargaJual x angka ini (naik bertahap sampai harga sekarang)   */
  transaksiContoh: {
    hari: 1095, seed: 20260, belumTerjual: ["BRG014", "BRG015"],
    musiman: [0.95, 0.95, 1.15, 1.25, 1.0, 1.0, 1.0, 1.05, 0.95, 0.95, 1.0, 1.2],
    tumbuh: 0.25, hargaAwal: 0.88,
    bayar: { tunai: 0.68, qris: 0.22 },   // sisanya Transfer
  },

  /* ---------- PEMASOK (satu pemasok per kategori barang) ---------- */
  pemasok: [
    { id: 1, nama: "CV Sumber Pangan Makmur",      kontak: "0285-4412301", kategoriId: 1 },
    { id: 2, nama: "UD Camilan Nusantara",         kontak: "0285-4419872", kategoriId: 2 },
    { id: 3, nama: "PT Segar Tirta Abadi",         kontak: "0285-4423310", kategoriId: 3 },
    { id: 4, nama: "Grosir Bersih Sejahtera",      kontak: "0285-4430055", kategoriId: 4 },
    { id: 5, nama: "CV Rumah Bersih Lestari",      kontak: "0285-4436620", kategoriId: 5 },
  ],

  /* ---------- KEUANGAN ----------
     modalAwal  : setoran modal pemilik pada hari pertama
     biayaTetap : biaya rutin bulanan -> tgl (tanggal tiap bulan), jumlah (Rp, harga akhir periode), variasi (naik-turun acak)
     Penjualan harian dan pembelian stok (restock) dicatat otomatis ke buku kas.                          */
  keuangan: {
    modalAwal: 30000000,
    biayaTetap: [
      { kategori: "Sewa", nama: "Sewa toko", tgl: 1, jumlah: 1500000, variasi: 0 },
      { kategori: "Listrik dan Air", nama: "Tagihan listrik", tgl: 5, jumlah: 450000, variasi: 0.2 },
      { kategori: "Listrik dan Air", nama: "Tagihan air PDAM", tgl: 5, jumlah: 100000, variasi: 0.15 },
      { kategori: "Internet", nama: "Internet dan pulsa", tgl: 10, jumlah: 300000, variasi: 0 },
      { kategori: "Perlengkapan", nama: "Perlengkapan dan kebersihan", tgl: 15, jumlah: 200000, variasi: 0.4 },
      { kategori: "Gaji", nama: "Gaji kasir", tgl: 28, jumlah: 1800000, variasi: 0 },
    ],
  },

};
