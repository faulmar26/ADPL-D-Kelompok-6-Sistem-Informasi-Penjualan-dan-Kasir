(function (S) {
  "use strict";
  var U = S.util, ui = S.ui;

  /* ---------- Sesi (NFR-02) ---------- */
  S.auth = {
    sesi: function () {
      try { return JSON.parse(sessionStorage.getItem(S.config.KEY_SESI)); } catch (e) { return null; }
    },
    pengguna: function () {
      var s = S.auth.sesi();
      return s ? S.db.userById(s.userId) : null;
    },
    sentuh: function () {
      var s = S.auth.sesi();
      if (s) { s.terakhir = Date.now(); sessionStorage.setItem(S.config.KEY_SESI, JSON.stringify(s)); }
    },
    kedaluwarsa: function () {
      var s = S.auth.sesi();
      return !!s && Date.now() - s.terakhir > S.config.SESI_MENIT * 60000;
    },

    /* Pesan 3.4.1: login(username, password) -> hasil */
    login: function (username, password) {
      // Decision 1: kelengkapan input
      if (!String(username).trim() || !String(password)) {
        return { ok: false, pesan: "Data wajib diisi", kosong: { username: !String(username).trim(), password: !String(password) } };
      }
      // cariAkun() lalu Decision 2: akun ada, aktif, dan password cocok
      var u = S.db.cariUser(username);
      if (!u || !u.aktif || u.passwordHash !== U.sha256(password)) {
        return { ok: false, pesan: "Username atau password salah" };
      }
      sessionStorage.setItem(S.config.KEY_SESI, JSON.stringify({ userId: u.id, peran: u.peran, terakhir: Date.now() }));
      return { ok: true, user: u };
    },
    logout: function () {
      sessionStorage.removeItem(S.config.KEY_SESI);
      sessionStorage.removeItem(S.config.KEY_KERANJANG);
      sessionStorage.removeItem(S.config.KEY_STRUK);
    },
  };

  var NAMA_PERAN = { admin: "Admin", kasir: "Kasir", pemilik: "Pemilik", operator: "Operator" };
  S.namaPeran = NAMA_PERAN;
  var IKON_PERAN = { admin: "shield", kasir: "cart", pemilik: "wallet", operator: "users" };

  /* ---------- Halaman Login ---------- */
  S.pages.login = function (root, ctx) {
    root.innerHTML =
      '<div class="login-page">' +
      '<section class="login-brand" data-fig="Panel Brand">' +
      '<div class="logo-plate"><img src="assets/logo.webp" alt="Logo MyStore"></div>' +
      '<h1 class="sr-only">MyStore</h1>' +
      '<div class="brand-sub">Platform Pengelolaan Penjualan dan Kasir</div>' +
      '<p class="brand-desc">Catat penjualan dengan benar, jaga ketepatan stok, dan lihat laporan kapan saja.</p>' +
      '<ul class="brand-points">' +
      "<li>" + ui.icon("bolt", 16) + "Transaksi dihitung otomatis</li>" +
      "<li>" + ui.icon("box", 16) + "Stok berkurang sendiri setiap penjualan</li>" +
      "<li>" + ui.icon("shield", 16) + "Hak akses sesuai peran pengguna</li></ul>" +
"</section>" +
      '<section class="login-panel"><form class="login-card card" id="form-login" novalidate data-fig="Kartu Login">' +
      "<h2>Masuk ke akun Anda</h2>" +
      '<p class="muted-text">Gunakan username dan password yang telah didaftarkan.</p>' +
      '<div class="alert alert-error" id="login-alert" role="alert" hidden></div>' +
      '<div class="field"><label for="username">Username</label>' +
      '<div class="input-wrap">' + ui.icon("user", 18) + '<input class="input" id="username" name="username" type="text" autocomplete="username" placeholder="Masukkan username"></div>' +
      '<div class="field-error" id="err-username"></div></div>' +
      '<div class="field"><label for="password">Password</label>' +
      '<div class="input-wrap">' + ui.icon("lock", 18) + '<input class="input" id="password" name="password" type="password" autocomplete="current-password" placeholder="Masukkan password">' +
      '<button type="button" class="icon-btn" id="toggle-pw" aria-label="Tampilkan password">' + ui.icon("eye", 18) + "</button></div>" +
      '<div class="field-error" id="err-password"></div></div>' +
      '<button class="btn btn-primary btn-block" type="submit" data-link="#/dashboard">Masuk</button>' +
      '<div class="demo-box"><div class="demo-title">' + ui.icon("bolt", 14) + ' Login cepat (demo), klik peran untuk langsung masuk</div>' +
      '<div class="demo-list">' +
      S.db.muat().users.filter(function (u) { return u.demo; }).map(function (u) {
        var pw = (window.SIPK_DATA.users.find(function (x) { return x.id === u.id; }) || {}).password;
        return '<button type="button" class="chip chip-' + U.esc(u.peran) + '" data-u="' + U.esc(u.username) + '" data-p="' + U.esc(pw) + '">' + ui.icon(IKON_PERAN[u.peran] || "user", 15) + U.esc(S.namaPeran[u.peran]) + "</button>";
      }).join("") + "</div></div>" +
      "</form></section></div>";

    var form = root.querySelector("#form-login"), alertEl = root.querySelector("#login-alert");
    function tampilkanGalat(pesan, kosong) {
      alertEl.hidden = false; alertEl.innerHTML = ui.icon("alert", 18) + "<span>" + U.esc(pesan) + "</span>";
      ["username", "password"].forEach(function (f) {
        var bad = kosong && kosong[f];
        root.querySelector("#err-" + f).textContent = bad ? "Kolom ini wajib diisi" : "";
        root.querySelector("#" + f).classList.toggle("invalid", !!bad);
      });
    }
    if (ctx && ctx.flash) tampilkanGalat(ctx.flash);

    root.querySelector("#toggle-pw").onclick = function () {
      var p = root.querySelector("#password"), show = p.type === "password";
      p.type = show ? "text" : "password"; this.innerHTML = ui.icon(show ? "eyeoff" : "eye", 18);
    };
    root.querySelectorAll(".chip").forEach(function (c) {
      c.onclick = function () { root.querySelector("#username").value = c.dataset.u; root.querySelector("#password").value = c.dataset.p; alertEl.hidden = true; form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); };
    });
    form.onsubmit = function (e) {
      e.preventDefault();
      var r = S.auth.login(form.username.value, form.password.value);
      if (!r.ok) { tampilkanGalat(r.pesan, r.kosong); if (!r.kosong) form.password.value = ""; return; }
      ui.toast("Selamat datang, " + r.user.nama, "success");
      S.router.go("/dashboard");
    };
  };

  /* ---------- Dashboard ---------- */
  function ringkas(daftar) {
    return { total: daftar.reduce(function (a, t) { return a + t.total; }, 0), jumlah: daftar.length };
  }
  S.hitung = {
    antara: function (awal, akhir) { // awal & akhir "YYYY-MM-DD", inklusif
      return S.db.muat().transaksi.filter(function (t) { var d = t.tanggal.slice(0, 10); return d >= awal && d <= akhir; });
    },
    terlaris: function (daftar) {
      var m = {};
      daftar.forEach(function (t) { t.items.forEach(function (i) {
        m[i.kode] = m[i.kode] || { kode: i.kode, nama: i.nama, qty: 0, nilai: 0 };
        m[i.kode].qty += i.qty; m[i.kode].nilai += i.subtotal;
      }); });
      return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.qty - a.qty || b.nilai - a.nilai; });
    },
  };

  function kartu(ikon, label, nilai, sub) {
    return '<div class="stat card"><div class="stat-icon">' + ui.icon(ikon, 20) + '</div><div><div class="stat-label">' + label +
      '</div><div class="stat-value">' + nilai + "</div>" + (sub ? '<div class="stat-sub">' + sub + "</div>" : "") + "</div></div>";
  }

  S.pages.dashboard = function (root) {
    var user = S.auth.pengguna(), peran = user.peran, db = S.db.muat();
    var hari = U.tgl(), bulanAwal = hari.slice(0, 8) + "01";
    var hariIni = ringkas(S.hitung.antara(hari, hari)), bulanIni = ringkas(S.hitung.antara(bulanAwal, hari));
    var menipis = db.barang.filter(function (b) { return b.aktif && b.stok <= b.stokMinimum; });
    var html = '<div class="hero card" data-fig="Sambutan"><div><h2>Halo, ' + U.esc(user.nama) + '</h2><p class="muted-text">Anda masuk sebagai <strong>' +
      NAMA_PERAN[peran] + "</strong>. " + U.fmtTanggalPanjang() + ".</p></div>";
    if (peran === "kasir") html += '<a class="btn btn-primary" href="#/kasir">' + ui.icon("cart") + " Mulai Transaksi</a>";
    if (peran === "admin") html += '<a class="btn btn-primary" href="#/barang">' + ui.icon("box") + " Kelola Barang</a>";
    if (peran === "pemilik") html += '<a class="btn btn-primary" href="#/laporan">' + ui.icon("chart") + " Lihat Laporan</a>";
    if (peran === "operator") html += '<a class="btn btn-primary" href="#/user">' + ui.icon("user") + " Kelola Pengguna</a>";
    html += "</div>";

    html += '<div class="grid grid-4">';
    html += kartu("trend", "Penjualan hari ini", U.rupiah(hariIni.total), hariIni.jumlah + " transaksi");
    if (peran === "kasir") {
      html += kartu("receipt", "Transaksi hari ini", hariIni.jumlah, "Semua kasir");
      html += kartu("box", "Barang aktif", db.barang.filter(function (b) { return b.aktif; }).length, "Siap dijual");
      html += kartu("alert", "Stok menipis", menipis.length, "Perlu dilaporkan ke admin");
    } else {
      html += kartu("calendar", "Penjualan bulan ini", U.rupiah(bulanIni.total), bulanIni.jumlah + " transaksi");
      html += kartu("box", "Barang aktif", db.barang.filter(function (b) { return b.aktif; }).length, db.barang.length + " barang terdaftar");
      html += kartu("alert", "Stok menipis", menipis.length, "Di bawah stok minimum");
    }
    html += "</div>";

    html += '<div class="grid grid-2">';
    var terakhir = db.transaksi.slice(-6).reverse();
    html += '<div class="card"><div class="card-head"><h3>Transaksi terbaru</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>No. Transaksi</th><th>Waktu</th><th class="num">Total</th></tr></thead><tbody>' +
      terakhir.map(function (t) { return "<tr><td>" + t.no + "</td><td>" + U.fmtWaktu(t.tanggal) + '</td><td class="num">' + U.rupiah(t.total) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    if (peran === "pemilik") {
      var top = S.hitung.terlaris(S.hitung.antara(bulanAwal, hari)).slice(0, 5);
      html += '<div class="card"><div class="card-head"><h3>Barang terlaris bulan ini</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Barang</th><th class="num">Terjual</th></tr></thead><tbody>' +
        top.map(function (b) { return "<tr><td>" + U.esc(b.nama) + '</td><td class="num">' + b.qty + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    } else {
      html += '<div class="card"><div class="card-head"><h3>Stok menipis</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Barang</th><th class="num">Stok</th><th class="num">Minimum</th></tr></thead><tbody>' +
        (menipis.length ? menipis.map(function (b) { return "<tr><td>" + U.esc(b.nama) + '</td><td class="num"><span class="badge badge-danger">' + b.stok + '</span></td><td class="num">' + b.stokMinimum + "</td></tr>"; }).join("") : '<tr><td colspan="3" class="empty-cell">Semua stok aman</td></tr>') +
        "</tbody></table></div></div>";
    }
    html += "</div>";
    root.innerHTML = html;
  };
})(window.SIPK);
