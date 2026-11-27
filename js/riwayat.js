(function (S) {
  "use strict";
  var U = S.util, ui = S.ui, BATAS = 100;

  /* Pemeriksaan konsistensi transaksi + perbandingan dengan arsip */
  function periksa() {
    var db = S.db.muat(), masalah = [], nomor = {}, arsip = S.arsip.ambil(), ada = {};
    db.transaksi.forEach(function (t) {
      var hitung = t.items.reduce(function (a, i) { return a + i.subtotal; }, 0);
      if (nomor[t.no]) masalah.push(t.no + ": nomor transaksi ganda");
      nomor[t.no] = 1; ada[t.no] = t;
      if (hitung !== t.total) masalah.push(t.no + ": total (" + U.rupiah(t.total) + ") tidak sama dengan jumlah item (" + U.rupiah(hitung) + ")");
      if (t.bayar < t.total) masalah.push(t.no + ": jumlah bayar kurang dari total");
      if (t.kembalian !== t.bayar - t.total) masalah.push(t.no + ": kembalian tidak sesuai");
      t.items.forEach(function (i) { if (i.qty < 1 || i.harga * i.qty !== i.subtotal) masalah.push(t.no + ": subtotal " + i.nama + " tidak sesuai"); });
    });
    var hilang = [];
    arsip.forEach(function (a) {
      var t = ada[a.no];
      if (!t) { hilang.push(a); masalah.push(a.no + ": ada di arsip tetapi hilang dari data utama (dapat dipulihkan)"); }
      else if (t.total !== a.total) masalah.push(a.no + ": total di data utama berbeda dengan arsip");
    });
    db.barang.forEach(function (b) { if (b.stok < 0) masalah.push("Stok " + b.nama + " bernilai negatif"); });
    return { diperiksa: db.transaksi.length, arsip: arsip.length, masalah: masalah, hilang: hilang };
  }

  function unduh(nama, isi) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([isi], { type: "application/json" }));
    a.download = nama; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  S.pages.riwayat = function (root) {
    var user = S.auth.pengguna(), kasir = user.peran === "kasir", hari = U.tgl();
    var f = { cari: "", awal: U.tgl(U.tambahHari(new Date(), -6)), akhir: hari, metode: "" };

    function daftar() {
      var db = S.db.muat();
      return db.transaksi.filter(function (t) {
        var d = t.tanggal.slice(0, 10);
        return (!kasir || t.kasirId === user.id) && (!f.cari || t.no.toLowerCase().indexOf(f.cari) > -1) && (!f.awal || d >= f.awal) && (!f.akhir || d <= f.akhir) && (!f.metode || t.metode === f.metode);
      });
    }

    function lihat(no) {
      var t = S.db.muat().transaksi.find(function (x) { return x.no === no; }); if (!t) return;
      var terarsip = S.arsip.ambil().some(function (a) { return a.no === no; });
      ui.modal({
        judul: "Struk " + t.no, lebar: 420,
        isi: (terarsip ? '<p class="muted-text small" style="margin-bottom:10px">Salinan struk tersimpan di arsip permanen.</p>' : "") + '<div class="struk-wrap" style="display:flex;justify-content:center">' + S.strukHtml(t) + "</div>",
        tombol: [{ teks: "Tutup", kelas: "btn-outline" }, { teks: "Cetak ulang", kelas: "btn-primary", onClick: function () { window.print(); } }],
      });
    }

    function gambar() {
      var d = daftar(), arsip = {}; S.arsip.ambil().forEach(function (a) { arsip[a.no] = 1; });
      root.querySelector("#tbody").innerHTML = d.length ? d.slice().reverse().slice(0, BATAS).map(function (t) {
        return "<tr><td><strong>" + t.no + "</strong></td><td>" + U.fmtWaktu(t.tanggal) + "</td><td>" + U.esc((t.snap && t.snap.kasir) || (S.db.userById(t.kasirId) || {}).nama || "-") + '</td><td class="num">' + t.items.reduce(function (a, i) { return a + i.qty; }, 0) +
          "</td><td>" + t.metode + '</td><td class="num">' + U.rupiah(t.total) + "</td><td>" + (arsip[t.no] ? '<span class="badge badge-info">Terarsip</span>' : '<span class="badge badge-ok">Tercatat</span>') +
          '</td><td class="aksi"><button class="btn btn-outline btn-sm" data-lihat="' + t.no + '">' + ui.icon("receipt", 15) + " Struk</button></td></tr>";
      }).join("") : '<tr><td colspan="8" class="empty-cell">Tidak ada transaksi pada filter ini</td></tr>';
      root.querySelector("#jumlah").textContent = d.length > BATAS ? BATAS + " terbaru dari " + U.angka(d.length) + " transaksi" : d.length + " transaksi";
      root.querySelectorAll("[data-lihat]").forEach(function (b) { b.onclick = function () { lihat(b.dataset.lihat); }; });
    }

    function hasilPeriksa() {
      var r = periksa(), ok = !r.masalah.length;
      ui.modal({
        judul: "Hasil pemeriksaan data", lebar: 560,
        isi: "<p>" + U.angka(r.diperiksa) + " transaksi diperiksa, " + r.arsip + " salinan arsip dibandingkan.</p>" +
          (ok ? '<div class="alert" style="background:var(--ok-bg);color:var(--ok);border:1px solid #bfe9d6">' + ui.icon("check", 18) + "<span>Tidak ditemukan masalah. Data transaksi dan arsip konsisten.</span></div>" :
          '<div class="alert alert-error">' + ui.icon("alert", 18) + "<span>" + r.masalah.length + " masalah ditemukan.</span></div><ul class=\"masalah\">" + r.masalah.slice(0, 15).map(function (m) { return "<li>" + U.esc(m) + "</li>"; }).join("") + "</ul>" + (r.masalah.length > 15 ? '<p class="muted-text small">dan ' + (r.masalah.length - 15) + " lainnya</p>" : "")),
        tombol: [{ teks: "Tutup", kelas: "btn-outline" }].concat(r.hilang.length ? [{ teks: "Pulihkan " + r.hilang.length + " dari arsip", kelas: "btn-primary", onClick: function (m) {
          var n = S.arsip.gabung(S.db.muat(), r.hilang); S.db.simpan(); m.close(); ui.toast(n + " transaksi dipulihkan dari arsip", "success"); gambar();
        } }] : []),
      });
    }

    var alat = kasir ? "" : '<div class="alat"><button class="btn btn-outline" id="periksa">' + ui.icon("shield", 17) + ' Periksa data</button><button class="btn btn-outline" id="cadangan">' + ui.icon("download", 17) + ' Unduh cadangan</button><button class="btn btn-outline" id="pulih">' + ui.icon("history", 17) + ' Pulihkan dari berkas</button><input type="file" id="berkas" class="tersembunyi" accept="application/json"></div>';
    root.innerHTML = '<div class="page-head"><div><h2>Riwayat Transaksi</h2><p class="muted-text">Cari transaksi lama, lihat dan cetak ulang struk untuk validasi. <span id="jumlah"></span></p></div>' + alat + "</div>" +
      '<div class="card"><div class="row-form filter"><div class="field grow"><label for="h-cari">No. transaksi</label><input class="input" id="h-cari" type="search" placeholder="contoh: TRX-20261127"></div>' +
      '<div class="field"><label for="h-awal">Dari</label><input class="input" id="h-awal" type="date" value="' + f.awal + '"></div><div class="field"><label for="h-akhir">Sampai</label><input class="input" id="h-akhir" type="date" value="' + f.akhir + '"></div>' +
      '<div class="field"><label for="h-metode">Metode</label><select class="input" id="h-metode"><option value="">Semua</option><option>Tunai</option><option>QRIS</option><option>Transfer</option></select></div></div>' +
      '<div class="table-wrap scroll tall"><table class="table tbl-riwayat"><thead><tr><th>No. Transaksi</th><th>Waktu</th><th>Kasir</th><th class="num">Item</th><th>Metode</th><th class="num">Total</th><th>Status</th><th class="aksi">Struk</th></tr></thead><tbody id="tbody"></tbody></table></div></div>';
    [["cari", "h-cari", "input"], ["awal", "h-awal", "change"], ["akhir", "h-akhir", "change"], ["metode", "h-metode", "change"]].forEach(function (x) {
      var el = root.querySelector("#" + x[1]); el["on" + x[2]] = function () { f[x[0]] = x[0] === "cari" ? this.value.trim().toLowerCase() : this.value; gambar(); };
    });
    if (!kasir) {
      root.querySelector("#periksa").onclick = hasilPeriksa;
      root.querySelector("#cadangan").onclick = function () {
        var db = S.db.muat(); unduh("cadangan-transaksi_" + hari + ".json", JSON.stringify({ aplikasi: "MyStore", dibuat: U.waktu(), transaksi: db.transaksi }));
        ui.toast("Cadangan " + U.angka(db.transaksi.length) + " transaksi diunduh", "success");
      };
      root.querySelector("#pulih").onclick = function () { root.querySelector("#berkas").click(); };
      root.querySelector("#berkas").onchange = function () {
        var file = this.files[0]; if (!file) return; var rd = new FileReader();
        rd.onload = function () {
          try {
            var j = JSON.parse(rd.result), list = j.transaksi; if (!Array.isArray(list)) throw 0;
            var n = S.arsip.gabung(S.db.muat(), list); list.forEach(function (t) { if (t && t.no && t.snap) S.arsip.tambah(t); });
            S.db.simpan(); ui.toast(n ? n + " transaksi dipulihkan dari berkas" : "Tidak ada transaksi baru, semua nomor sudah ada", n ? "success" : "info"); gambar();
          } catch (e) { ui.toast("Berkas cadangan tidak valid", "error"); }
        };
        rd.readAsText(file); this.value = "";
      };
    }
    gambar();
  };
})(window.SIPK);
