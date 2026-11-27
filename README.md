# MyStore, Frontend Sistem Informasi Penjualan dan Kasir
Buka `index.html` di browser (tanpa server).
Data uji: ubah `js/data.js` (akun, barang, kategori, transaksi contoh, daftar skenario uji), simpan, lalu F5.
Setiap mengubah data.js, naikkan angka `versi` (sekarang 3) di data.js agar data lama di browser diganti.
Tombol Login cepat di halaman login langsung masuk memakai akun demo dari data.js.

Data uji mencakup 3 tahun terakhir dari hari ini: transaksi harian (+ metode bayar Tunai/QRIS/Transfer), pembelian stok dari pemasok, dan buku kas (penjualan, biaya tetap bulanan). Halaman Keuangan tersedia untuk admin, pemilik, operator; Laporan punya mode Tahunan.
Struktur: `js/data.js` (data uji), `js/store.js` (penyimpanan), `ui.js` (komponen), `auth.js` (FR-01 + dashboard), `barang.js` (FR-02),
`transaksi.js` (FR-03), `laporan.js` (FR-04), `app.js` (router, hak akses, sesi 15 menit).
Reset data demo: jalankan `SIPK.db.reset(); location.reload()` di konsol browser.

Logo: `assets/logo.webp` (login), `assets/logo-mark.webp` (sidebar), `assets/favicon.webp`; semuanya berlatar transparan.
Riwayat Transaksi (menu semua peran; kasir hanya melihat transaksinya sendiri): cari transaksi lama, lihat dan cetak ulang struk.
Setiap pembayaran juga disalin ke arsip permanen (`localStorage` kunci `sipk_arsip_v1`) beserta data struk (nama toko, alamat, kasir saat itu).
Arsip TIDAK terhapus saat `SIPK.db.reset()` atau `versi` data dinaikkan: transaksi nyata otomatis digabung kembali, stok dan buku kas ikut disesuaikan.
Admin/pemilik/operator punya alat: Periksa data (cek total, kembalian, stok, dan bandingkan dengan arsip), Unduh cadangan (JSON), Pulihkan dari berkas.
Menghapus arsip (tidak disarankan): jalankan `localStorage.removeItem("sipk_arsip_v1")` di konsol.


Kelompok: 6
Judul Sistem: Sistem Informasi Penjualan dan Kasir
Nama Anggota:
1. 60225018 - Muhammad Rofi' Ihsan (FR-04)
2. 60225042 - Magalis Mifta Khuddin Firmansyah (FR-03)
3. 60225048 - Faka Auliansyah Maulana Ro'ad (FR-01)
4. 60225070 - Nadya Paramesti Amirasyifa (FR-02)
