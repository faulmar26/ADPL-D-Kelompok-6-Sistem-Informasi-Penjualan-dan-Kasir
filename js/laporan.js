(function (S) {
  "use strict";
  var U = S.util, ui = S.ui;

  /* Entity Laporan.validasiPeriode(awal, akhir) */
  function periode(mode, v) {
    var awal, akhir;
    if (mode === "harian") { awal = akhir = v.hari; }
    else if (mode === "bulanan") {
      if (!v.bulan) return { galat: "Periode tidak valid: pilih bulan terlebih dahulu" };
      var p = v.bulan.split("-"), last = new Date(Number(p[0]), Number(p[1]), 0).getDate();
      awal = v.bulan + "-01"; akhir = v.bulan + "-" + U.pad(last);
    } else { awal = v.awal; akhir = v.akhir; }
    if (!awal || !akhir) return { galat: "Periode tidak valid: tanggal wajib diisi" };
    if (akhir < awal) return { galat: "Periode tidak valid: tanggal akhir lebih awal dari tanggal awal" };
    return { awal: awal, akhir: akhir };
  }

  function unduh(nama, isi, mime) {
    var blob = new Blob([isi], { type: mime }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  S.pages.laporan = function (root) {
    var mode = "bulanan", hasil = null, hari = U.tgl(), nilai = { hari: hari, bulan: hari.slice(0, 7), tahun: hari.slice(0, 4), awal: U.tgl(U.tambahHari(new Date(), -6)), akhir: hari };

    function eksporExcel() {
      var h = hasil, baris = h.daftar.map(function (t) {
        return "<tr><td>" + t.no + "</td><td>" + U.fmtWaktu(t.tanggal) + "</td><td>" + U.esc((S.db.userById(t.kasirId) || {}).nama || "-") + "</td><td>" + t.items.reduce(function (a, i) { return a + i.qty; }, 0) + "</td><td>" + t.total + "</td></tr>";
      }).join("");
      var html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><h3>Laporan Penjualan ' + U.esc(S.config.NAMA_TOKO) + "</h3><p>Periode: " + h.awal + " s.d. " + h.akhir +
        "</p><p>Total penjualan: " + h.total + " | Jumlah transaksi: " + h.daftar.length + '</p><table border="1"><tr><th>No. Transaksi</th><th>Waktu</th><th>Kasir</th><th>Jumlah Item</th><th>Total (Rp)</th></tr>' + baris + "</table></body></html>";
      unduh("laporan-penjualan_" + h.awal + "_" + h.akhir + ".xls", html, "application/vnd.ms-excel");
      ui.toast("Berkas Excel berhasil diunduh", "success");
    }

    function tampil() {
      var box = root.querySelector("#hasil"), p = periode(mode, nilai);
      var err = root.querySelector("#err-periode");
      if (p.galat) { err.hidden = false; err.innerHTML = ui.icon("alert", 18) + "<span>" + U.esc(p.galat) + "</span>"; box.innerHTML = ""; hasil = null; ui.toast("Periode tidak valid", "error"); return; }
      err.hidden = true;
      var daftar = S.hitung.antara(p.awal, p.akhir);
      if (!daftar.length) {
        hasil = null;
        box.innerHTML = '<div class="card empty-state">' + ui.icon("info", 30) + "<h3>Tidak ada data</h3><p class=\"muted-text\">Belum ada transaksi pada periode " + U.fmtTanggal(p.awal) + " s.d. " + U.fmtTanggal(p.akhir) + ".</p></div>";
        return;
      }
      var total = daftar.reduce(function (a, t) { return a + t.total; }, 0), top = S.hitung.terlaris(daftar);
      hasil = { awal: p.awal, akhir: p.akhir, daftar: daftar, total: total, top: top };

      var perBulan = (p.akhir > p.awal) && (new Date(p.akhir) - new Date(p.awal)) / 864e5 > 62, perHari = {}; daftar.forEach(function (t) { var d = t.tanggal.slice(0, perBulan ? 7 : 10); perHari[d] = (perHari[d] || 0) + t.total; });
      var tgls = Object.keys(perHari).sort(), maks = Math.max.apply(null, tgls.map(function (d) { return perHari[d]; }));
      var chart = tgls.length > 1 ? '<div class="card"><div class="card-head"><h3>Penjualan per ' + (perBulan ? "bulan" : "hari") + '</h3></div><div class="chart">' + tgls.map(function (d) {
        return '<div class="bar-col" title="' + U.fmtTanggal(d) + ": " + U.rupiah(perHari[d]) + '"><div class="bar" style="height:' + Math.max(4, Math.round(perHari[d] / maks * 100)) + '%"></div><span>' + (perBulan ? d.slice(5) : d.slice(8)) + "</span></div>";
      }).join("") + "</div></div>" : "";

      box.innerHTML = '<div class="print-area"><div class="print-title"><h2>Laporan Penjualan</h2><p>' + U.esc(S.config.NAMA_TOKO) + " · Periode " + U.fmtTanggal(p.awal) + " s.d. " + U.fmtTanggal(p.akhir) + "</p></div>" +
        '<div class="grid grid-3">' +
        '<div class="stat card"><div class="stat-icon">' + ui.icon("trend", 20) + '</div><div><div class="stat-label">Total penjualan</div><div class="stat-value">' + U.rupiah(total) + "</div></div></div>" +
        '<div class="stat card"><div class="stat-icon">' + ui.icon("receipt", 20) + '</div><div><div class="stat-label">Jumlah transaksi</div><div class="stat-value">' + daftar.length + "</div></div></div>" +
        '<div class="stat card"><div class="stat-icon">' + ui.icon("box", 20) + '</div><div><div class="stat-label">Barang terlaris</div><div class="stat-value sm">' + U.esc(top[0].nama) + '</div><div class="stat-sub">' + top[0].qty + " terjual</div></div></div></div>" +
        chart + '<div class="grid grid-2"><div class="card"><div class="card-head"><h3>5 barang terlaris</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Barang</th><th class="num">Terjual</th><th class="num">Nilai</th></tr></thead><tbody>' +
        top.slice(0, 5).map(function (b, i) { return "<tr><td>" + (i + 1) + "</td><td>" + U.esc(b.nama) + '</td><td class="num">' + b.qty + '</td><td class="num">' + U.rupiah(b.nilai) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
        '<div class="card"><div class="card-head"><h3>Daftar transaksi' + (daftar.length > 300 ? " (300 terbaru dari " + U.angka(daftar.length) + ")" : "") + '</h3></div><div class="table-wrap scroll"><table class="table"><thead><tr><th>No. Transaksi</th><th>Waktu</th><th class="num">Total</th></tr></thead><tbody>' +
        daftar.slice().reverse().slice(0, 300).map(function (t) { return "<tr><td>" + t.no + "</td><td>" + U.fmtWaktu(t.tanggal) + '</td><td class="num">' + U.rupiah(t.total) + "</td></tr>"; }).join("") + "</tbody></table></div></div></div></div>" +
        '<div class="actions end no-print"><button class="btn btn-outline" id="ex-pdf">' + ui.icon("printer") + ' Ekspor PDF</button><button class="btn btn-primary" id="ex-xls">' + ui.icon("download") + " Ekspor Excel</button></div>";
      root.querySelector("#ex-xls").onclick = eksporExcel;
      root.querySelector("#ex-pdf").onclick = function () { ui.toast("Pilih \"Simpan sebagai PDF\" pada dialog cetak", "info"); setTimeout(function () { window.print(); }, 400); };
    }

    root.innerHTML =
      '<div class="page-head"><div><h2>Laporan Penjualan</h2><p class="muted-text">Pilih periode untuk melihat total penjualan, jumlah transaksi, dan barang terlaris.</p></div></div>' +
      '<form class="card pad no-print" id="form-periode" novalidate><div class="tabs" role="tablist">' +
      ["harian:Harian", "bulanan:Bulanan", "tahunan:Tahunan", "rentang:Rentang tanggal"].map(function (x) { var s = x.split(":"); return '<button type="button" role="tab" class="tab' + (s[0] === mode ? " active" : "") + '" data-mode="' + s[0] + '">' + s[1] + "</button>"; }).join("") +
      '</div><div class="row-form" id="inputs"></div><div class="alert alert-error" id="err-periode" role="alert" hidden></div></form><div id="hasil" class="stack"></div>';

    function inputs() {
      var w = root.querySelector("#inputs");
      var f = function (id, label, tipe, v) { return '<div class="field"><label for="p-' + id + '">' + label + '</label><input class="input" id="p-' + id + '" type="' + tipe + '" value="' + v + '"></div>'; };
      w.innerHTML = (mode === "harian" ? f("hari", "Tanggal", "date", nilai.hari) : mode === "bulanan" ? f("bulan", "Bulan", "month", nilai.bulan) : mode === "tahunan" ? f("tahun", "Tahun", "number", nilai.tahun).replace("<input", "<input min=\"2000\" max=\"2100\" step=\"1\"") : f("awal", "Tanggal awal", "date", nilai.awal) + f("akhir", "Tanggal akhir", "date", nilai.akhir)) +
        '<button class="btn btn-primary" type="submit">' + ui.icon("search") + " Tampilkan Laporan</button>";
      w.querySelectorAll("input").forEach(function (i) { i.onchange = function () { nilai[i.id.slice(2)] = i.value; }; });
    }
    root.querySelectorAll(".tab").forEach(function (b) { b.onclick = function () {
      mode = b.dataset.mode; root.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("active", x === b); }); inputs(); root.querySelector("#err-periode").hidden = true; }; });
    root.querySelector("#form-periode").onsubmit = function (e) {
      e.preventDefault();
      root.querySelectorAll("#inputs input").forEach(function (i) { nilai[i.id.slice(2)] = i.value; });
      tampil();
    };
    inputs(); tampil();
  };
})(window.SIPK);
