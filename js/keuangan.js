(function (S) {
  "use strict";
  var U = S.util, ui = S.ui;

  function jumlahkan(daftar, fn) { return daftar.reduce(function (a, e) { return a + (fn(e) ? e.jumlah : 0); }, 0); }
  var penjualan = function (e) { return e.kategori === "Penjualan"; }, keluar = function (e) { return e.jenis === "Pengeluaran"; };
  function rekap(daftar) { var m = jumlahkan(daftar, penjualan), k = jumlahkan(daftar, keluar); return { masuk: m, keluar: k, laba: m - k }; }

  /* Halaman Keuangan: ringkasan per hari, bulan, dan tahun dari buku kas */
  S.pages.keuangan = function (root) {
    var db = S.db.muat(), hari = U.tgl(), mode = "bulanan", jenis = "";
    var nilai = { hari: hari, bulan: hari.slice(0, 7), tahun: hari.slice(0, 4) };
    var tahunAda = Object.keys(db.keuangan.reduce(function (m, e) { m[e.tanggal.slice(0, 4)] = 1; return m; }, {})).sort();

    function rentang() {
      if (mode === "harian") return [nilai.hari, nilai.hari];
      if (mode === "bulanan") return [nilai.bulan + "-01", nilai.bulan + "-31"];
      return [nilai.tahun + "-01-01", nilai.tahun + "-12-31"];
    }
    var baris = function (arr) { return arr.map(function (c) { return "<tr><td>" + c[0] + '</td><td class="num">' + U.rupiah(c[1]) + '</td><td class="num">' + U.rupiah(c[2]) + '</td><td class="num"><strong>' + U.rupiah(c[3]) + "</strong></td></tr>"; }).join(""); };
    var kepala = function (a) { return "<thead><tr><th>" + a + '</th><th class="num">Penjualan</th><th class="num">Pengeluaran</th><th class="num">Laba</th></tr></thead>'; };

    function gambar() {
      var r = rentang(), semua = db.keuangan, daftar = semua.filter(function (e) { return e.tanggal >= r[0] && e.tanggal <= r[1]; }), h = rekap(daftar);
      var saldo = semua.filter(function (e) { return e.tanggal <= r[1]; }).reduce(function (a, e) { return a + (e.jenis === "Pemasukan" ? e.jumlah : -e.jumlah); }, 0);
      var kartu = function (ik, lb, v, sub) { return '<div class="stat card"><div class="stat-icon">' + ui.icon(ik, 20) + '</div><div><div class="stat-label">' + lb + '</div><div class="stat-value">' + U.rupiah(v) + "</div>" + (sub ? '<div class="stat-sub">' + sub + "</div>" : "") + "</div></div>"; };
      root.querySelector("#kartu").innerHTML = kartu("trend", "Penjualan", h.masuk, daftar.filter(penjualan).length + " hari tercatat") + kartu("receipt", "Pengeluaran", h.keluar, "Stok, sewa, gaji, dan lainnya") +
        kartu("chart", "Laba bersih", h.laba, h.masuk ? Math.round(h.laba / h.masuk * 100) + "% dari penjualan" : "") + kartu("wallet", "Saldo kas", saldo, "Sampai akhir periode");

      var perKat = {}; daftar.filter(keluar).forEach(function (e) { perKat[e.kategori] = (perKat[e.kategori] || 0) + e.jumlah; });
      root.querySelector("#kategori").innerHTML = Object.keys(perKat).length ? Object.keys(perKat).sort(function (a, b) { return perKat[b] - perKat[a]; }).map(function (k) {
        return "<tr><td>" + U.esc(k) + '</td><td class="num">' + U.rupiah(perKat[k]) + '</td><td class="num">' + Math.round(perKat[k] / h.keluar * 100) + "%</td></tr>";
      }).join("") : '<tr><td colspan="3" class="empty-cell">Tidak ada pengeluaran</td></tr>';

      var grup = mode === "tahunan" ? 7 : 10, bagian = {};
      daftar.forEach(function (e) { var k = e.tanggal.slice(0, grup); (bagian[k] = bagian[k] || []).push(e); });
      var ks = Object.keys(bagian).sort();
      root.querySelector("#rekap-judul").textContent = mode === "tahunan" ? "Rekap per bulan" : mode === "bulanan" ? "Rekap per hari" : "Rincian hari ini";
      root.querySelector("#rekap").innerHTML = kepala(mode === "tahunan" ? "Bulan" : "Tanggal") + "<tbody>" + (mode === "harian" ? baris([[U.fmtTanggal(nilai.hari), h.masuk, h.keluar, h.laba]]) : baris(ks.map(function (k) { var x = rekap(bagian[k]); return [mode === "tahunan" ? U.bulan[Number(k.slice(5)) - 1] : U.fmtTanggal(k), x.masuk, x.keluar, x.laba]; }))) + "</tbody>";

      var lj = daftar.filter(function (e) { return !jenis || e.jenis === jenis; });
      root.querySelector("#jumlah-kas").textContent = lj.length > 200 ? "200 terbaru dari " + U.angka(lj.length) + " catatan" : lj.length + " catatan";
      root.querySelector("#kas").innerHTML = lj.length ? lj.slice().reverse().slice(0, 200).map(function (e) {
        return "<tr><td>" + U.fmtTanggal(e.tanggal) + "</td><td>" + e.id + "</td><td>" + U.esc(e.keterangan) + '</td><td><span class="badge badge-muted">' + U.esc(e.kategori) + '</span></td><td class="num"><span class="' + (e.jenis === "Pemasukan" ? "plus" : "minus") + '">' + (e.jenis === "Pemasukan" ? "+ " : "- ") + U.rupiah(e.jumlah) + "</span></td></tr>";
      }).join("") : '<tr><td colspan="5" class="empty-cell">Belum ada catatan pada periode ini</td></tr>';
    }

    function inputs() {
      var w = root.querySelector("#inputs");
      w.innerHTML = mode === "harian" ? '<div class="field"><label for="k-hari">Tanggal</label><input class="input" id="k-hari" type="date" value="' + nilai.hari + '"></div>' :
        mode === "bulanan" ? '<div class="field"><label for="k-bulan">Bulan</label><input class="input" id="k-bulan" type="month" value="' + nilai.bulan + '"></div>' :
        '<div class="field"><label for="k-tahun">Tahun</label><select class="input" id="k-tahun">' + tahunAda.map(function (y) { return "<option" + (y === nilai.tahun ? " selected" : "") + ">" + y + "</option>"; }).join("") + "</select></div>";
      w.querySelector("input,select").onchange = function () { if (this.value) { nilai[this.id.slice(2)] = this.value; gambar(); } };
    }

    var ringkasTahun = tahunAda.map(function (y) { var x = rekap(db.keuangan.filter(function (e) { return e.tanggal.slice(0, 4) === y; })); return [y, x.masuk, x.keluar, x.laba]; });
    root.innerHTML = '<div class="page-head"><div><h2>Keuangan</h2><p class="muted-text">Buku kas penjualan, pembelian stok, dan biaya operasional selama ' + tahunAda.length + " tahun.</p></div></div>" +
      '<div class="card"><div class="card-head"><h3>Ringkasan per tahun</h3></div><div class="table-wrap"><table class="table">' + kepala("Tahun") + "<tbody>" + baris(ringkasTahun) + "</tbody></table></div></div><div style=\"height:16px\"></div>" +
      '<form class="card pad" id="form-k" novalidate onsubmit="return false"><div class="tabs">' + ["harian:Harian", "bulanan:Bulanan", "tahunan:Tahunan"].map(function (x) { var s = x.split(":"); return '<button type="button" class="tab' + (s[0] === mode ? " active" : "") + '" data-mode="' + s[0] + '">' + s[1] + "</button>"; }).join("") + '</div><div class="row-form" id="inputs"></div></form><div style="height:16px"></div>' +
      '<div class="grid grid-4" id="kartu"></div><div class="grid grid-2"><div class="card"><div class="card-head"><h3 id="rekap-judul"></h3></div><div class="table-wrap scroll"><table class="table" id="rekap"></table></div></div>' +
      '<div class="card"><div class="card-head"><h3>Pengeluaran per kategori</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Kategori</th><th class="num">Jumlah</th><th class="num">Porsi</th></tr></thead><tbody id="kategori"></tbody></table></div></div></div>' +
      '<div class="card"><div class="card-head"><h3>Buku kas <span class="muted-text small" id="jumlah-kas"></span></h3><select class="input w-auto" id="f-jenis"><option value="">Semua</option><option>Pemasukan</option><option>Pengeluaran</option></select></div><div class="table-wrap scroll tall"><table class="table"><thead><tr><th>Tanggal</th><th>No. Kas</th><th>Keterangan</th><th>Kategori</th><th class="num">Jumlah</th></tr></thead><tbody id="kas"></tbody></table></div></div>';
    root.querySelectorAll(".tab").forEach(function (b) { b.onclick = function () { mode = b.dataset.mode; root.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("active", x === b); }); inputs(); gambar(); }; });
    root.querySelector("#f-jenis").onchange = function () { jenis = this.value; gambar(); };
    inputs(); gambar();
  };
})(window.SIPK);
