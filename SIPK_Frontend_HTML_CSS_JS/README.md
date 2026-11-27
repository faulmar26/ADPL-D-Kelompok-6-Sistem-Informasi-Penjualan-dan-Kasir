# Frontend SIPK (HTML + CSS + JavaScript)
Buka `index.html` di browser (tanpa server). Data tersimpan di localStorage browser.

| Peran | Username | Password |
|---|---|---|
| Admin | admin | admin123 |
| Kasir | kasir | kasir123 |
| Pemilik | pemilik | pemilik123 |
(`nonaktif / nonaktif123` untuk mencoba akun nonaktif)

Data uji: ubah `js/data.js` (akun, barang, kategori, transaksi contoh, daftar skenario uji), simpan, lalu F5.
Naikkan angka `versi` di data.js agar data lama di browser diganti.

Struktur: `js/data.js` (data uji), `js/store.js` (penyimpanan), `ui.js` (komponen), `auth.js` (FR-01 + dashboard), `barang.js` (FR-02),
`transaksi.js` (FR-03), `laporan.js` (FR-04), `app.js` (router, hak akses, sesi 15 menit).
Reset data demo: jalankan `SIPK.db.reset(); location.reload()` di konsol browser.
