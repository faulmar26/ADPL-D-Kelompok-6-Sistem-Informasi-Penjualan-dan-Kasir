/* =====================================================================
   store.js  -  Data, penyimpanan (localStorage), dan fungsi bantu
   Sistem Informasi Penjualan dan Kasir (SIPK) - Toko Berkah Mandiri
   Kelompok 6 | ADPL | INF-B
   ===================================================================== */
window.SIPK = window.SIPK || {};

(function (S) {
  "use strict";

  /* ---------- Konfigurasi ---------- */
  S.config = {
    NAMA_TOKO: "Toko Berkah Mandiri",
    ALAMAT_TOKO: "Jl. Raya Pekalongan No. 12, Pekalongan",
    SESI_MENIT: 15,            // NFR-02: sesi berakhir setelah 15 menit tidak aktif
    KEY_DATA: "sipk_data_v1",
    KEY_SESI: "sipk_sesi_v1",
    KEY_KERANJANG: "sipk_keranjang_v1",
    KEY_STRUK: "sipk_struk_v1",
  };

  /* ---------- Hash SHA-256 (NFR-01: password tidak disimpan sebagai teks biasa) ----------
     Catatan: ini hanya untuk simulasi di sisi klien. Pada sistem nyata, hash dilakukan
     di server dengan algoritma khusus password (misalnya bcrypt atau argon2).            */
  function sha256(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    var maxWord = Math.pow(2, 32), result = "", words = [], asciiBitLength = ascii.length * 8;
    var hash = (sha256.h = sha256.h || []), k = (sha256.k = sha256.k || []), primeCounter = k.length, isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (var i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\x80";
    while ((ascii.length % 64) - 56) ascii += "\x00";
    for (var x = 0; x < ascii.length; x++) {
      var j = ascii.charCodeAt(x);
      if (j >> 8) return;
      words[x >> 2] |= j << (((3 - x) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (var jj = 0; jj < words.length; ) {
      var w = words.slice(jj, (jj += 16)), oldHash = hash;
      hash = hash.slice(0, 8);
      for (var n = 0; n < 64; n++) {
        var w15 = w[n - 15], w2 = w[n - 2], a = hash[0], e = hash[4];
        var temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[n] +
          (w[n] = n < 16 ? w[n] : (w[n - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[n - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (var m = 0; m < 8; m++) hash[m] = (hash[m] + oldHash[m]) | 0;
    }
    for (var p = 0; p < 8; p++) for (var q = 3; q + 1; q--) { var b = (hash[p] >> (q * 8)) & 255; result += (b < 16 ? 0 : "") + b.toString(16); }
    return result;
  }

  /* ---------- Fungsi bantu ---------- */
  var pad = function (n, l) { return String(n).padStart(l || 2, "0"); };
  var util = {
    sha256: function (teks) { return sha256(unescape(encodeURIComponent(String(teks)))); },
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    rupiah: function (n) { return "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID"); },
    angka: function (n) { return Math.round(Number(n) || 0).toLocaleString("id-ID"); },
    pad: pad,
    /* Tanggal lokal "YYYY-MM-DD" */
    tgl: function (d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); },
    /* Tanggal-waktu lokal "YYYY-MM-DDTHH:mm:ss" */
    waktu: function (d) { d = d || new Date(); return util.tgl(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); },
    bulan: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
    hari: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    fmtTanggal: function (iso) {
      var d = new Date(iso);
      return d.getDate() + " " + util.bulan[d.getMonth()].slice(0, 3) + " " + d.getFullYear();
    },
    fmtTanggalPanjang: function (d) {
      d = d || new Date();
      return util.hari[d.getDay()] + ", " + d.getDate() + " " + util.bulan[d.getMonth()] + " " + d.getFullYear();
    },
    fmtWaktu: function (iso) {
      var d = new Date(iso);
      return util.fmtTanggal(iso) + ", " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    },
    tambahHari: function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; },
  };
  S.util = util;

  /* ---------- Data awal (seed) ---------- */
  function rng(seed) { // generator acak yang konsisten (mulberry32)
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buatDataAwal() {
    var D = window.SIPK_DATA;
    if (!D) throw new Error("data.js belum dimuat. Pastikan <script src=\"js/data.js\"> ada sebelum store.js");
    var users = D.users.map(function (u) {
      return { id: u.id, nama: u.nama, username: u.username, passwordHash: util.sha256(u.password), peran: u.peran, aktif: u.aktif !== false, demo: !!u.demo };
    });
    var kategori = D.kategori.map(function (k) { return { id: k.id, nama: k.nama }; });
    var barang = D.barang.map(function (r) {
      return { kode: r[0], nama: r[1], kategoriId: r[2], hargaBeli: r[3], hargaJual: r[4], stok: r[5], stokMinimum: r[6], aktif: true };
    });
    // Transaksi contoh 45 hari terakhir. BRG014 dan BRG015 sengaja belum pernah terjual,
    // sehingga dapat dipakai untuk mendemonstrasikan penghapusan permanen (FR-02).
    var TC = D.transaksiContoh || { hari: 0, seed: 1, belumTerjual: [] };
    var rand = rng(TC.seed);
    var pool = barang.filter(function (x) { return TC.belumTerjual.indexOf(x.kode) < 0; });
    var transaksi = [], hariIni = new Date(), counter = {};
    for (var off = (TC.hari > 0 ? TC.hari - 1 : -1); off >= 0; off--) {
      var tgl = util.tambahHari(hariIni, -off);
      var jml = off === 0 ? 3 : 2 + Math.floor(rand() * 5);
      for (var t = 0; t < jml; t++) {
        var d = new Date(tgl); d.setHours(8 + Math.floor(rand() * 12), Math.floor(rand() * 60), Math.floor(rand() * 60));
        if (off === 0 && d > hariIni) d = new Date(hariIni.getTime() - (t + 1) * 600000);
        var nItem = 1 + Math.floor(rand() * 4), dipakai = {}, items = [], total = 0;
        for (var i = 0; i < nItem; i++) {
          var br = pool[Math.floor(rand() * pool.length)];
          if (dipakai[br.kode]) continue;
          dipakai[br.kode] = 1;
          var qty = 1 + Math.floor(rand() * 3);
          items.push({ kode: br.kode, nama: br.nama, qty: qty, harga: br.hargaJual, subtotal: qty * br.hargaJual });
          total += qty * br.hargaJual;
        }
        var key = util.tgl(d); counter[key] = (counter[key] || 0) + 1;
        var bayar = Math.ceil(total / 5000) * 5000;
        transaksi.push({
          no: "TRX-" + key.replace(/-/g, "") + "-" + pad(counter[key], 3),
          tanggal: util.waktu(d), kasirId: 2, total: total, metode: "Tunai",
          bayar: bayar, kembalian: bayar - total, status: "Selesai", items: items,
        });
      }
    }
    transaksi.sort(function (a, c) { return a.tanggal < c.tanggal ? -1 : 1; });
    return { versi: D.versi, users: users, kategori: kategori, barang: barang, transaksi: transaksi };
  }

  /* ---------- Akses data ---------- */
  var cache = null;
  S.db = {
    muat: function () {
      if (cache) return cache;
      try { cache = JSON.parse(localStorage.getItem(S.config.KEY_DATA)); } catch (e) { cache = null; }
      if (!cache || !cache.barang || cache.versi !== window.SIPK_DATA.versi) { cache = buatDataAwal(); S.db.simpan(); }
      return cache;
    },
    simpan: function () { try { localStorage.setItem(S.config.KEY_DATA, JSON.stringify(cache)); } catch (e) { /* abaikan */ } },
    reset: function () {
      cache = buatDataAwal(); S.db.simpan();
      sessionStorage.removeItem(S.config.KEY_KERANJANG); sessionStorage.removeItem(S.config.KEY_STRUK);
    },
    cariUser: function (username) {
      var u = String(username || "").trim().toLowerCase();
      return S.db.muat().users.find(function (x) { return x.username.toLowerCase() === u; });
    },
    userById: function (id) { return S.db.muat().users.find(function (x) { return x.id === id; }); },
    barang: function (kode) {
      var k = String(kode || "").trim().toUpperCase();
      return S.db.muat().barang.find(function (x) { return x.kode.toUpperCase() === k; });
    },
    kategoriNama: function (id) {
      var k = S.db.muat().kategori.find(function (x) { return x.id === Number(id); });
      return k ? k.nama : "-";
    },
    pernahTerjual: function (kode) {
      return S.db.muat().transaksi.some(function (t) { return t.items.some(function (i) { return i.kode === kode; }); });
    },
    noTransaksiBaru: function () {
      var key = util.tgl(), pref = "TRX-" + key.replace(/-/g, "") + "-";
      var n = S.db.muat().transaksi.filter(function (t) { return t.no.indexOf(pref) === 0; }).length + 1;
      return pref + pad(n, 3);
    },
  };

  S.pages = S.pages || {};
})(window.SIPK);
