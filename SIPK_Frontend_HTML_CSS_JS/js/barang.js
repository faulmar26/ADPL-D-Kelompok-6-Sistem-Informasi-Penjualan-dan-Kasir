/* =====================================================================
   barang.js  -  FR-02 Pengelolaan Data Barang
   Penanggung jawab: Nadya Paramesti Amirasyifa (60225070)
   Diagram acuan: Activity (Gambar 3.4), Sequence (Gambar 3.8)
   ===================================================================== */
(function (S) {
  "use strict";
  var U = S.util, ui = S.ui;

  /* Entity Barang.validasi(data): kode unik, harga > 0, stok tidak negatif */
  function validasi(d, modeUbah) {
    var e = {};
    if (!d.kode) e.kode = "Kode barang wajib diisi";
    else if (!/^[A-Za-z0-9\-_]+$/.test(d.kode)) e.kode = "Kode hanya huruf, angka, - dan _";
    else if (!modeUbah && S.db.barang(d.kode)) e.kode = "Kode barang sudah digunakan";
    if (!d.nama) e.nama = "Nama barang wajib diisi";
    if (!d.kategoriId) e.kategoriId = "Pilih kategori";
    if (d.hargaBeli === "" || isNaN(d.hargaBeli) || d.hargaBeli < 0) e.hargaBeli = "Harga beli tidak boleh negatif";
    if (d.hargaJual === "" || isNaN(d.hargaJual) || d.hargaJual <= 0) e.hargaJual = "Harga jual harus lebih dari 0";
    if (d.stok === "" || isNaN(d.stok) || d.stok < 0 || !Number.isInteger(d.stok)) e.stok = "Stok harus bilangan bulat dan tidak negatif";
    if (d.stokMinimum === "" || isNaN(d.stokMinimum) || d.stokMinimum < 0 || !Number.isInteger(d.stokMinimum)) e.stokMinimum = "Stok minimum tidak boleh negatif";
    return e;
  }

  function formHtml(b) {
    var db = S.db.muat(), v = b || {};
    var opsi = db.kategori.map(function (k) { return '<option value="' + k.id + '"' + (v.kategoriId === k.id ? " selected" : "") + ">" + U.esc(k.nama) + "</option>"; }).join("");
    var f = function (id, label, nilai, tipe, extra) {
      return '<div class="field"><label for="f-' + id + '">' + label + '</label><input class="input" id="f-' + id + '" type="' + (tipe || "text") + '" value="' + U.esc(nilai == null ? "" : nilai) + '" ' + (extra || "") + '><div class="field-error" id="e-' + id + '"></div></div>';
    };
    return '<form id="form-barang" novalidate><div class="form-grid">' +
      f("kode", "Kode Barang", v.kode, "text", b ? "readonly" : 'placeholder="contoh: BRG016"') +
      f("nama", "Nama Barang", v.nama, "text", 'placeholder="Nama barang"') +
      '<div class="field"><label for="f-kategoriId">Kategori</label><select class="input" id="f-kategoriId"><option value="">Pilih kategori</option>' + opsi + '</select><div class="field-error" id="e-kategoriId"></div></div>' +
      '<div class="field"><label for="f-aktif">Status</label><select class="input" id="f-aktif"><option value="1"' + (v.aktif !== false ? " selected" : "") + '>Aktif</option><option value="0"' + (v.aktif === false ? " selected" : "") + ">Nonaktif</option></select></div>" +
      f("hargaBeli", "Harga Beli (Rp)", v.hargaBeli, "number", 'min="0" step="100"') +
      f("hargaJual", "Harga Jual (Rp)", v.hargaJual, "number", 'min="0" step="100"') +
      f("stok", "Stok", v.stok, "number", 'min="0" step="1"') +
      f("stokMinimum", "Stok Minimum", v.stokMinimum == null ? 10 : v.stokMinimum, "number", 'min="0" step="1"') +
      "</div></form>";
  }

  function bacaForm(root) {
    var g = function (id) { return root.querySelector("#f-" + id).value.trim(); };
    var n = function (id) { var s = g(id); return s === "" ? "" : Number(s); };
    return { kode: g("kode").toUpperCase(), nama: g("nama"), kategoriId: Number(g("kategoriId")) || 0, hargaBeli: n("hargaBeli"), hargaJual: n("hargaJual"), stok: n("stok"), stokMinimum: n("stokMinimum"), aktif: g("aktif") === "1" };
  }

  S.pages.barang = function (root) {
    var kata = "", kat = "";

    function bukaForm(b) {
      var modeUbah = !!b;
      ui.modal({
        judul: modeUbah ? "Ubah Barang" : "Tambah Barang", lebar: 640, isi: formHtml(b),
        tombol: [
          { teks: "Batal", kelas: "btn-outline" },
          { teks: modeUbah ? "Simpan Perubahan" : "Simpan Barang", kelas: "btn-primary", onClick: function (m) {
            var d = bacaForm(m.el), err = validasi(d, modeUbah);
            m.el.querySelectorAll(".field-error").forEach(function (x) { x.textContent = ""; });
            m.el.querySelectorAll(".input").forEach(function (x) { x.classList.remove("invalid"); });
            var keys = Object.keys(err);
            if (keys.length) {
              keys.forEach(function (k) { m.el.querySelector("#e-" + k).textContent = err[k]; m.el.querySelector("#f-" + k).classList.add("invalid"); });
              ui.toast("Data tidak valid, data tidak disimpan", "error"); return;
            }
            var db = S.db.muat();
            if (modeUbah) { Object.assign(S.db.barang(d.kode), d); }
            else db.barang.push(d);
            S.db.simpan(); m.close();
            ui.toast(modeUbah ? "Data barang berhasil diperbarui" : "Barang berhasil ditambahkan", "success");
            gambar();
          } },
        ],
      });
    }

    function hapus(kode) {
      var b = S.db.barang(kode), terjual = S.db.pernahTerjual(kode);
      ui.konfirmasi({
        judul: "Hapus barang?", bahaya: true, ya: terjual ? "Nonaktifkan" : "Hapus",
        pesan: "Barang <strong>" + U.esc(b.nama) + "</strong> (" + b.kode + ") akan " + (terjual ? "dinonaktifkan karena sudah pernah terjual, sehingga riwayat transaksi tetap utuh." : "dihapus permanen karena belum pernah terjual."),
      }).then(function (ok) {
        if (!ok) { ui.toast("Penghapusan dibatalkan", "info"); return; }
        var db = S.db.muat();
        if (terjual) { b.aktif = false; ui.toast("Barang dinonaktifkan, riwayat transaksi tetap ada", "success"); }
        else { db.barang = db.barang.filter(function (x) { return x.kode !== kode; }); ui.toast("Barang berhasil dihapus", "success"); }
        S.db.simpan(); gambar();
      });
    }

    function gambar() {
      var db = S.db.muat();
      var daftar = db.barang.filter(function (b) {
        var cocok = !kata || b.kode.toLowerCase().indexOf(kata) > -1 || b.nama.toLowerCase().indexOf(kata) > -1;
        return cocok && (!kat || String(b.kategoriId) === kat);
      });
      root.querySelector("#tbody").innerHTML = daftar.length ? daftar.map(function (b) {
        var rendah = b.stok <= b.stokMinimum;
        return "<tr" + (b.aktif ? "" : ' class="row-muted"') + "><td><strong>" + b.kode + "</strong></td><td>" + U.esc(b.nama) + "</td><td>" + U.esc(S.db.kategoriNama(b.kategoriId)) +
          '</td><td class="num">' + U.rupiah(b.hargaBeli) + '</td><td class="num">' + U.rupiah(b.hargaJual) +
          '</td><td class="num"><span class="badge ' + (rendah ? "badge-danger" : "badge-ok") + '">' + b.stok + "</span></td><td>" +
          (b.aktif ? '<span class="badge badge-ok">Aktif</span>' : '<span class="badge badge-muted">Nonaktif</span>') +
          '</td><td class="aksi"><button class="icon-btn" data-ubah="' + b.kode + '" aria-label="Ubah ' + U.esc(b.nama) + '" title="Ubah">' + ui.icon("edit", 17) +
          '</button><button class="icon-btn danger" data-hapus="' + b.kode + '" aria-label="Hapus ' + U.esc(b.nama) + '" title="Hapus">' + ui.icon("trash", 17) + "</button></td></tr>";
      }).join("") : '<tr><td colspan="8" class="empty-cell">Barang tidak ditemukan</td></tr>';
      root.querySelector("#jumlah").textContent = daftar.length + " dari " + db.barang.length + " barang";
      root.querySelectorAll("[data-ubah]").forEach(function (b) { b.onclick = function () { bukaForm(S.db.barang(b.dataset.ubah)); }; });
      root.querySelectorAll("[data-hapus]").forEach(function (b) { b.onclick = function () { hapus(b.dataset.hapus); }; });
    }

    var db = S.db.muat();
    root.innerHTML =
      '<div class="page-head"><div><h2>Data Barang</h2><p class="muted-text">Tambah, ubah, hapus, dan cari barang. <span id="jumlah"></span></p></div>' +
      '<button class="btn btn-primary" id="btn-tambah">' + ui.icon("plus") + " Tambah Barang</button></div>" +
      '<div class="card"><div class="toolbar"><div class="input-wrap grow">' + ui.icon("search", 18) + '<input class="input" id="cari" type="search" placeholder="Cari kode atau nama barang"></div>' +
      '<select class="input w-auto" id="filter-kat"><option value="">Semua kategori</option>' + db.kategori.map(function (k) { return '<option value="' + k.id + '">' + U.esc(k.nama) + "</option>"; }).join("") + "</select></div>" +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th class="num">Harga Beli</th><th class="num">Harga Jual</th><th class="num">Stok</th><th>Status</th><th class="aksi">Aksi</th></tr></thead><tbody id="tbody"></tbody></table></div></div>';
    root.querySelector("#btn-tambah").onclick = function () { bukaForm(null); };
    root.querySelector("#cari").oninput = function () { kata = this.value.trim().toLowerCase(); gambar(); };
    root.querySelector("#filter-kat").onchange = function () { kat = this.value; gambar(); };
    gambar();
  };
})(window.SIPK);
