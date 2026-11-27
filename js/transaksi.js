(function (S) {
  "use strict";
  var U = S.util, ui = S.ui;

  /* ---------- Keranjang (entity Transaksi sementara) ---------- */
  var K = {
    ambil: function () { try { return JSON.parse(sessionStorage.getItem(S.config.KEY_KERANJANG)) || []; } catch (e) { return []; } },
    simpan: function (k) { sessionStorage.setItem(S.config.KEY_KERANJANG, JSON.stringify(k)); },
    total: function (k) { return k.reduce(function (a, i) { return a + i.qty * i.harga; }, 0); },
    /* Pesan tambahItem(kode, qty): cek barang dan stok, lalu masukkan ke keranjang */
    tambah: function (kode, qty) {
      qty = Number(qty);
      if (!kode || !String(kode).trim()) return { ok: false, pesan: "Kode barang wajib diisi" };
      if (!Number.isInteger(qty) || qty < 1) return { ok: false, pesan: "Jumlah minimal 1 dan harus bilangan bulat" };
      var b = S.db.barang(kode);
      if (!b || !b.aktif) return { ok: false, pesan: "Barang atau stok tidak tersedia (kode " + String(kode).toUpperCase() + " tidak ditemukan)" };
      var k = K.ambil(), ada = k.find(function (i) { return i.kode === b.kode; }), sudah = ada ? ada.qty : 0;
      if (sudah + qty > b.stok) return { ok: false, pesan: "Barang atau stok tidak tersedia (stok " + b.nama + " tersisa " + b.stok + ")" };
      if (ada) ada.qty += qty; else k.push({ kode: b.kode, nama: b.nama, harga: b.hargaJual, qty: qty });
      K.simpan(k);
      return { ok: true, pesan: b.nama + " ditambahkan ke keranjang" };
    },
  };
  S.keranjang = K;

  /* ---------- Halaman Transaksi Kasir ---------- */
  S.pages.kasir = function (root) {
    var kata = "";
    function gambar() {
      var k = K.ambil(), total = K.total(k), db = S.db.muat();
      root.querySelector("#keranjang").innerHTML = k.length ? k.map(function (i, n) {
        var b = S.db.barang(i.kode);
        return "<tr><td>" + (n + 1) + "</td><td><strong>" + U.esc(i.nama) + '</strong><div class="muted-text small">' + i.kode + '</div></td><td class="num">' + U.rupiah(i.harga) +
          '</td><td class="qty"><button class="icon-btn sm" data-min="' + i.kode + '" aria-label="Kurangi">' + ui.icon("minus", 14) + "</button><span>" + i.qty +
          '</span><button class="icon-btn sm" data-plus="' + i.kode + '" aria-label="Tambah">' + ui.icon("plus", 14) + '</button></td><td class="num">' + U.rupiah(i.qty * i.harga) +
          '</td><td><button class="icon-btn danger sm" data-del="' + i.kode + '" aria-label="Hapus item">' + ui.icon("trash", 15) + "</button></td></tr>";
      }).join("") : '<tr><td colspan="6" class="empty-cell">Keranjang masih kosong. Masukkan kode barang atau pilih dari daftar.</td></tr>';
      root.querySelector("#total").textContent = U.rupiah(total);
      root.querySelector("#item-count").textContent = k.reduce(function (a, i) { return a + i.qty; }, 0) + " item";
      root.querySelectorAll("[data-plus]").forEach(function (b) { b.onclick = function () { var r = K.tambah(b.dataset.plus, 1); if (!r.ok) ui.toast(r.pesan, "error"); gambar(); }; });
      root.querySelectorAll("[data-min]").forEach(function (b) { b.onclick = function () {
        var kk = K.ambil(), it = kk.find(function (x) { return x.kode === b.dataset.min; });
        it.qty -= 1; K.simpan(kk.filter(function (x) { return x.qty > 0; })); gambar(); }; });
      root.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { K.simpan(K.ambil().filter(function (x) { return x.kode !== b.dataset.del; })); gambar(); }; });

      var daftar = db.barang.filter(function (b) { return b.aktif && (!kata || b.kode.toLowerCase().indexOf(kata) > -1 || b.nama.toLowerCase().indexOf(kata) > -1); });
      root.querySelector("#katalog").innerHTML = daftar.length ? daftar.map(function (b) {
        return '<button class="produk" data-add="' + b.kode + '"' + (b.stok < 1 ? " disabled" : "") + '><span class="produk-nama">' + U.esc(b.nama) + '</span><span class="produk-meta">' + b.kode +
          ' · stok ' + b.stok + '</span><span class="produk-harga">' + U.rupiah(b.hargaJual) + "</span></button>";
      }).join("") : '<div class="empty-cell">Barang tidak ditemukan</div>';
      root.querySelectorAll("[data-add]").forEach(function (b) { b.onclick = function () { var r = K.tambah(b.dataset.add, 1); ui.toast(r.pesan, r.ok ? "success" : "error", 2200); gambar(); }; });
    }

    root.innerHTML =
      '<div class="page-head"><div><h2>Transaksi Kasir</h2><p class="muted-text">Masukkan kode barang dan jumlah, lalu tekan Bayar.</p></div></div>' +
      '<div class="grid kasir-grid"><div class="stack">' +
      '<form class="card pad" id="form-item" novalidate><div class="row-form"><div class="field grow"><label for="kode">Kode barang</label>' +
      '<input class="input" id="kode" list="dl-barang" placeholder="contoh: BRG005" autocomplete="off"></div>' +
      '<div class="field w-qty"><label for="qty">Jumlah</label><input class="input" id="qty" type="number" min="1" step="1" value="1"></div>' +
      '<button class="btn btn-primary" type="submit">' + ui.icon("plus") + " Tambah</button></div>" +
      '<datalist id="dl-barang">' + S.db.muat().barang.filter(function (b) { return b.aktif; }).map(function (b) { return '<option value="' + b.kode + '">' + U.esc(b.nama) + "</option>"; }).join("") + "</datalist>" +
      '<div class="alert alert-error" id="msg" role="alert" hidden></div></form>' +
      '<div class="card"><div class="card-head"><h3>Cari barang</h3><div class="input-wrap sm">' + ui.icon("search", 16) + '<input class="input" id="cari" type="search" placeholder="Cari nama atau kode"></div></div><div class="katalog" id="katalog"></div></div></div>' +
      '<div class="card keranjang-card"><div class="card-head"><h3>Keranjang Belanja</h3><span class="badge badge-muted" id="item-count"></span></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Barang</th><th class="num">Harga</th><th>Qty</th><th class="num">Subtotal</th><th></th></tr></thead><tbody id="keranjang"></tbody></table></div>' +
      '<div class="total-box"><span>Total belanja</span><strong id="total">Rp 0</strong></div>' +
      '<div class="actions"><button class="btn btn-outline" id="kosongkan">Kosongkan</button><button class="btn btn-primary btn-lg" id="bayar" data-link="#/bayar">Bayar ' + ui.icon("receipt") + "</button></div></div></div>";

    var msg = root.querySelector("#msg");
    root.querySelector("#form-item").onsubmit = function (e) {
      e.preventDefault();
      var r = K.tambah(root.querySelector("#kode").value, root.querySelector("#qty").value);
      msg.hidden = r.ok;
      if (!r.ok) { msg.innerHTML = ui.icon("alert", 18) + "<span>" + U.esc(r.pesan) + "</span>"; }
      else { ui.toast(r.pesan, "success", 2200); root.querySelector("#kode").value = ""; root.querySelector("#qty").value = 1; root.querySelector("#kode").focus(); }
      gambar();
    };
    root.querySelector("#cari").oninput = function () { kata = this.value.trim().toLowerCase(); gambar(); };
    root.querySelector("#kosongkan").onclick = function () { K.simpan([]); msg.hidden = true; gambar(); };
    root.querySelector("#bayar").onclick = function () {
      if (!K.ambil().length) { msg.hidden = false; msg.innerHTML = ui.icon("alert", 18) + "<span>Keranjang masih kosong</span>"; ui.toast("Keranjang masih kosong", "error"); return; }
      S.router.go("/bayar");
    };
    gambar();
  };

  /* ---------- Halaman Pembayaran dan Struk ---------- */
  function strukHtml(t) {
    var k = S.db.userById(t.kasirId), sn = t.snap || {};
    return '<div class="struk print-area" id="struk"><div class="struk-head"><strong>' + U.esc(sn.toko || S.config.NAMA_TOKO) + "</strong><div>" + U.esc(sn.alamat || S.config.ALAMAT_TOKO) + "</div></div>" +
      '<div class="struk-line"></div><div class="struk-row"><span>No</span><span>' + t.no + '</span></div><div class="struk-row"><span>Tanggal</span><span>' + U.fmtWaktu(t.tanggal) +
      '</span></div><div class="struk-row"><span>Kasir</span><span>' + U.esc(sn.kasir || (k ? k.nama : "-")) + '</span></div><div class="struk-line"></div>' +
      t.items.map(function (i) { return '<div class="struk-item">' + U.esc(i.nama) + '</div><div class="struk-row"><span>' + i.qty + " x " + U.angka(i.harga) + "</span><span>" + U.angka(i.subtotal) + "</span></div>"; }).join("") +
      '<div class="struk-line"></div><div class="struk-row bold"><span>TOTAL</span><span>' + U.rupiah(t.total) + '</span></div><div class="struk-row"><span>Bayar (' + t.metode + ')</span><span>' + U.rupiah(t.bayar) +
      '</span></div><div class="struk-row"><span>Kembalian</span><span>' + U.rupiah(t.kembalian) + '</span></div><div class="struk-line"></div><div class="struk-foot">Terima kasih atas kunjungan Anda</div></div>';
  }

  S.strukHtml = strukHtml;

  S.pages.bayar = function (root) {
    var struk = null;
    try { struk = JSON.parse(sessionStorage.getItem(S.config.KEY_STRUK)); } catch (e) { /* kosong */ }
    var k = K.ambil();

    if (!k.length && struk) { // setelah pembayaran berhasil: tampilkan struk (FR-06)
      root.innerHTML = '<div class="page-head"><div><h2>Pembayaran Berhasil</h2><p class="muted-text">Transaksi tersimpan dan stok barang sudah diperbarui.</p></div></div>' +
        '<div class="grid struk-grid"><div class="card pad center-col"><div class="success-ring">' + ui.icon("check", 34) + '</div><h3>Kembalian ' + U.rupiah(struk.kembalian) + '</h3><p class="muted-text">Serahkan struk dan kembalian kepada pelanggan.</p>' +
        '<div class="actions col"><button class="btn btn-primary" id="cetak">' + ui.icon("printer") + ' Cetak Struk</button><a class="btn btn-outline" href="#/kasir" data-link="#/kasir">Transaksi Baru</a></div></div>' +
        '<div class="card pad struk-wrap">' + strukHtml(struk) + "</div></div>";
      root.querySelector("#cetak").onclick = function () { window.print(); };
      return;
    }
    if (!k.length) { S.router.go("/kasir"); return; }

    var total = K.total(k);
    root.innerHTML =
      '<div class="page-head"><div><h2>Pembayaran</h2><p class="muted-text">Isi jumlah bayar, sistem menghitung kembalian.</p></div><a class="btn btn-outline" href="#/kasir">Kembali ke Keranjang</a></div>' +
      '<div class="grid grid-2"><div class="card"><div class="card-head"><h3>Ringkasan belanja</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Barang</th><th class="num">Qty</th><th class="num">Subtotal</th></tr></thead><tbody>' +
      k.map(function (i) { return "<tr><td>" + U.esc(i.nama) + '</td><td class="num">' + i.qty + '</td><td class="num">' + U.rupiah(i.qty * i.harga) + "</td></tr>"; }).join("") +
      '</tbody></table></div><div class="total-box"><span>Total belanja</span><strong>' + U.rupiah(total) + "</strong></div></div>" +
      '<form class="card pad" id="form-bayar" novalidate><div class="field"><label for="metode">Metode pembayaran</label><select class="input" id="metode"><option>Tunai</option></select></div>' +
      '<div class="field"><label for="jumlah">Jumlah bayar (Rp)</label><input class="input input-lg" id="jumlah" type="number" min="0" step="500" inputmode="numeric" placeholder="0"><div class="field-error" id="e-jumlah"></div></div>' +
      '<div class="quick"><button type="button" class="chip" data-v="' + total + '">Uang pas</button>' +
      [20000, 50000, 100000].map(function (v) { return '<button type="button" class="chip" data-v="' + v + '">' + U.angka(v) + "</button>"; }).join("") + "</div>" +
      '<div class="kembalian"><span>Kembalian</span><strong id="kembali">Rp 0</strong></div>' +
      '<div class="alert alert-error" id="msg" role="alert" hidden></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Proses Pembayaran</button></form></div>';

    var inp = root.querySelector("#jumlah"), kemb = root.querySelector("#kembali"), msg = root.querySelector("#msg");
    function hitung() { var j = Number(inp.value) || 0; kemb.textContent = U.rupiah(Math.max(0, j - total)); }
    inp.oninput = hitung;
    root.querySelectorAll(".chip").forEach(function (c) { c.onclick = function () { inp.value = c.dataset.v; hitung(); }; });
    root.querySelector("#form-bayar").onsubmit = function (e) {
      e.preventDefault();
      var bayar = Number(inp.value);
      msg.hidden = true; root.querySelector("#e-jumlah").textContent = ""; inp.classList.remove("invalid");
      // Pembayaran.validasi(): jumlah bayar >= total
      if (inp.value === "" || isNaN(bayar) || bayar < total) {
        var kurang = total - (bayar || 0);
        msg.hidden = false; msg.innerHTML = ui.icon("alert", 18) + "<span>Pembayaran kurang (kurang " + U.rupiah(kurang) + ")</span>";
        inp.classList.add("invalid"); ui.toast("Pembayaran kurang", "error"); return;
      }
      // Periksa ulang stok sebelum menyimpan (NFR-06: stok tidak boleh negatif)
      var gagal = k.find(function (i) { var b = S.db.barang(i.kode); return !b || !b.aktif || b.stok < i.qty; });
      if (gagal) { msg.hidden = false; msg.innerHTML = ui.icon("alert", 18) + "<span>Barang atau stok tidak tersedia: " + U.esc(gagal.nama) + "</span>"; return; }
      var t = {
        no: S.db.noTransaksiBaru(), tanggal: U.waktu(), kasirId: S.auth.pengguna().id, total: total, metode: root.querySelector("#metode").value,
        bayar: bayar, kembalian: bayar - total, status: "Selesai",
        items: k.map(function (i) { return { kode: i.kode, nama: i.nama, qty: i.qty, harga: i.harga, subtotal: i.qty * i.harga }; }),
      };
      var db = S.db.muat();
      var pk = S.auth.pengguna(); t.snap = { toko: S.config.NAMA_TOKO, alamat: S.config.ALAMAT_TOKO, kasir: pk.nama };   // salinan data struk saat transaksi
      db.transaksi.push(t);
      db.keuangan.push({ id: "KAS-" + t.no.replace("TRX-", ""), tanggal: t.tanggal.slice(0, 10), jenis: "Pemasukan", kategori: "Penjualan", keterangan: "Penjualan " + t.no, jumlah: t.total, ref: t.no });                                                                   // simpan transaksi + detail
      k.forEach(function (i) { S.db.barang(i.kode).stok -= i.qty; });                          // Barang.kurangiStok()
      S.arsip.tambah(t);                                                                      // arsip permanen (riwayat)
      S.db.simpan(); K.simpan([]);
      sessionStorage.setItem(S.config.KEY_STRUK, JSON.stringify(t));
      ui.toast("Transaksi " + t.no + " berhasil disimpan", "success");
      S.pages.bayar(root);
    };
  };
})(window.SIPK);
