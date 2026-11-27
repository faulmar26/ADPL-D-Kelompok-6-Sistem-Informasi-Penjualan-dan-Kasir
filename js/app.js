(function (S) {
  "use strict";
  var U = S.util, ui = S.ui;

  var RUTE = {
    "/login":     { judul: "Login",               peran: null },
    "/dashboard": { judul: "Dashboard",           peran: ["admin", "kasir", "pemilik", "operator"], ikon: "home",    menu: "Dashboard" },
    "/barang":    { judul: "Data Barang",         peran: ["admin", "operator"],                     ikon: "box",     menu: "Data Barang" },
    "/kasir":     { judul: "Transaksi Kasir",     peran: ["kasir", "operator"],                     ikon: "cart",    menu: "Transaksi Kasir" },
    "/bayar":     { judul: "Pembayaran dan Struk", peran: ["kasir", "operator"],                    ikon: "receipt", menu: "Pembayaran dan Struk" },
    "/laporan":   { judul: "Laporan Penjualan",   peran: ["admin", "pemilik", "operator"],          ikon: "chart",   menu: "Laporan Penjualan" },
    "/riwayat":   { judul: "Riwayat Transaksi",   peran: ["admin", "kasir", "pemilik", "operator"], ikon: "history", menu: "Riwayat Transaksi" },
    "/keuangan":  { judul: "Keuangan",            peran: ["admin", "pemilik", "operator"],          ikon: "wallet",  menu: "Keuangan" },
    "/user":      { judul: "Kelola Pengguna",     peran: ["operator"],                               ikon: "users",   menu: "Kelola Pengguna" },
  };

  var flash = null;

  S.router = {
    go: function (path) {
      if (location.hash === "#" + path) S.router.render(); else location.hash = "#" + path;
    },
    render: function () {
      var path = (location.hash || "").replace(/^#/, "") || "/dashboard";
      if (!RUTE[path]) path = "/dashboard";
      var root = document.getElementById("app"), user = S.auth.pengguna();

      if (S.auth.kedaluwarsa()) { S.auth.logout(); flash = "Sesi berakhir karena tidak ada aktivitas selama " + S.config.SESI_MENIT + " menit"; user = null; }
      if (!user) {
        if (path !== "/login") { location.hash = "#/login"; return; }
        document.title = "Login · MyStore";
        S.pages.login(root, { flash: flash }); flash = null; return;
      }
      if (path === "/login") { location.hash = "#/dashboard"; return; }
      var r = RUTE[path];
      if (r.peran.indexOf(user.peran) < 0) { ui.toast("Anda tidak memiliki akses ke halaman tersebut", "error"); location.hash = "#/dashboard"; return; }

      document.title = r.judul + " · MyStore";
      var nav = Object.keys(RUTE).filter(function (k) { return RUTE[k].menu && RUTE[k].peran.indexOf(user.peran) > -1; }).map(function (k) {
        return '<a class="nav-item' + (k === path ? " active" : "") + '" href="#' + k + '" data-link="#' + k + '">' + ui.icon(RUTE[k].ikon, 19) + "<span>" + RUTE[k].menu + "</span></a>";
      }).join("");

      root.innerHTML =
        '<div class="shell"><aside class="sidebar" id="sidebar" data-fig="Sidebar"><div class="side-brand"><div class="logo-tile"><img src="assets/logo-mark.webp" alt="Logo MyStore"></div><div><strong>MyStore</strong><small>' + U.esc(S.config.NAMA_TOKO) + "</small></div></div>" +
        '<nav class="nav">' + nav + '</nav><div class="side-foot"><div class="user-box"><div class="avatar">' + U.esc(user.nama.charAt(0)) + '</div><div class="user-info"><strong>' + U.esc(user.nama) + "</strong><small>" + S.namaPeran[user.peran] + "</small></div></div>" +
        '<button class="btn btn-side" id="btn-logout" data-link="#/login">' + ui.icon("logout", 18) + " Logout</button></div></aside>" +
        '<div class="main"><header class="topbar" data-fig="Topbar"><button class="icon-btn only-mobile" id="btn-menu" aria-label="Menu">' + ui.icon("menu", 22) + '</button><div class="crumb"><span class="muted-text">MyStore</span> / <strong>' + r.judul + "</strong></div>" +
        '<div class="topbar-right"><span class="date-pill">' + ui.icon("calendar", 16) + U.fmtTanggalPanjang() + '</span><span class="role-pill role-' + user.peran + '">' + S.namaPeran[user.peran] + '</span></div></header>' +
        '<main class="content" id="content" data-fig="Konten"></main></div></div>';

      root.querySelector("#btn-logout").onclick = function () { S.auth.logout(); ui.toast("Anda telah keluar", "info"); location.hash = "#/login"; };
      root.querySelector("#btn-menu").onclick = function () { root.querySelector("#sidebar").classList.toggle("open"); };
      root.querySelectorAll(".nav-item").forEach(function (a) { a.addEventListener("click", function () { root.querySelector("#sidebar").classList.remove("open"); }); });
      if (path === "/kasir") sessionStorage.removeItem(S.config.KEY_STRUK);
      S.pages[path.slice(1)](root.querySelector("#content"));
      window.scrollTo(0, 0);
    },
  };

  /* Pantau aktivitas untuk batas waktu sesi (NFR-02) */
  var terakhir = 0;
  ["click", "keydown", "mousemove", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, function () { var n = Date.now(); if (n - terakhir > 5000) { terakhir = n; S.auth.sentuh(); } }, { passive: true });
  });
  setInterval(function () { if (S.auth.sesi() && S.auth.kedaluwarsa()) S.router.render(); }, 15000);

  window.addEventListener("hashchange", S.router.render);
  window.addEventListener("DOMContentLoaded", function () { S.db.muat(); S.router.render(); });
})(window.SIPK);
