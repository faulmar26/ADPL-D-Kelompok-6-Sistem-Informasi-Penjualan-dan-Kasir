/* =====================================================================
   data.js  -  DATA UJI yang boleh diubah-ubah untuk praktikum
   Ubah isi file ini, simpan, lalu muat ulang halaman (F5).
   Jika angka "versi" dinaikkan, data di browser otomatis diganti dengan data baru.
   ===================================================================== */
window.SIPK_DATA = {
  versi: 2,   // <- naikkan (3, 4, ...) setiap kali mengubah data ini

  /* ---------- AKUN PENGGUNA ----------
     peran : "admin" | "kasir" | "pemilik"
     aktif : false  -> akun ditolak saat login (untuk uji GAGAL)
     demo  : true   -> muncul sebagai tombol cepat di halaman login          */
  users: [
    { id: 1, nama: "Faka Auliansyah",  username: "admin",    password: "admin123",    peran: "admin",   aktif: true,  demo: true },
    { id: 2, nama: "Magalis Mifta",    username: "kasir",    password: "kasir123",    peran: "kasir",   aktif: true,  demo: true },
    { id: 3, nama: "Muhammad Rofi'",   username: "pemilik",  password: "pemilik123",  peran: "pemilik", aktif: true,  demo: true },
    { id: 4, nama: "Akun Nonaktif",    username: "nonaktif", password: "nonaktif123", peran: "kasir",   aktif: false, demo: false },
    // tambahkan akun baru di sini, contoh:
    // { id: 5, nama: "Kasir Dua", username: "kasir2", password: "rahasia1", peran: "kasir", aktif: true, demo: true },
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

  /* ---------- TRANSAKSI CONTOH (untuk isi laporan) ----------
     hari          : jumlah hari ke belakang yang diisi transaksi contoh (0 = tanpa transaksi)
     belumTerjual  : kode barang yang SENGAJA tidak pernah terjual -> bisa dihapus permanen (FR-02)
                     barang lain yang pernah terjual hanya akan dinonaktifkan saat dihapus. */
  transaksiContoh: { hari: 45, seed: 20260, belumTerjual: ["BRG014", "BRG015"] },

  /* ---------- SKENARIO UJI (tampil di halaman login) ---------- */
  skenarioUji: [
    { modul: "Login",   aksi: "Kosongkan username/password lalu Masuk",         hasil: "GAGAL - \"Data wajib diisi\"" },
    { modul: "Login",   aksi: "admin / password salah",                          hasil: "GAGAL - \"Username atau password salah\"" },
    { modul: "Login",   aksi: "nonaktif / nonaktif123",                          hasil: "GAGAL - akun nonaktif ditolak" },
    { modul: "Login",   aksi: "admin / admin123",                                hasil: "BERHASIL - masuk Dashboard Admin" },
    { modul: "Barang",  aksi: "Tambah kode BRG001 (sudah ada)",                  hasil: "GAGAL - \"Kode barang sudah digunakan\"" },
    { modul: "Barang",  aksi: "Tambah barang dengan harga jual 0 atau stok -1",  hasil: "GAGAL - data tidak disimpan" },
    { modul: "Barang",  aksi: "Tambah BRG016 dengan data lengkap",               hasil: "BERHASIL - barang muncul di tabel" },
    { modul: "Barang",  aksi: "Hapus BRG015 (belum terjual)",                    hasil: "BERHASIL - dihapus permanen" },
    { modul: "Barang",  aksi: "Hapus BRG001 (sudah terjual)",                    hasil: "BERHASIL - dinonaktifkan" },
    { modul: "Kasir",   aksi: "Kode XXX atau BRG006 qty 99",                     hasil: "GAGAL - \"Barang atau stok tidak tersedia\"" },
    { modul: "Kasir",   aksi: "BRG008 x2 + BRG009 x1 + BRG004 x1 (total Rp 40.500)", hasil: "BERHASIL - total benar" },
    { modul: "Bayar",   aksi: "Bayar Rp 30.000 untuk total Rp 40.500",           hasil: "GAGAL - \"Pembayaran kurang\"" },
    { modul: "Bayar",   aksi: "Bayar Rp 50.000 untuk total Rp 40.500",           hasil: "BERHASIL - kembalian Rp 9.500, stok berkurang" },
    { modul: "Laporan", aksi: "Rentang: tanggal akhir lebih awal dari awal",     hasil: "GAGAL - \"Periode tidak valid\"" },
    { modul: "Laporan", aksi: "Periode tahun 2020",                              hasil: "GAGAL - \"Tidak ada data\"" },
    { modul: "Laporan", aksi: "Bulanan bulan ini lalu Ekspor Excel",             hasil: "BERHASIL - berkas .xls terunduh" },
  ],
};
