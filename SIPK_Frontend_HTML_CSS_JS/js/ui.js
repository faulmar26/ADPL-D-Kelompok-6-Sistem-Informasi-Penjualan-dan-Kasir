/* =====================================================================
   ui.js  -  Komponen antarmuka bersama: ikon, toast, modal, konfirmasi
   ===================================================================== */
(function (S) {
  "use strict";

  var P = {
    home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12.5h11L21 7H6"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4.2"/><path d="M6.6 6.6A17 17 0 002 12s3.6 7 10 7a9.8 9.8 0 004.4-1"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };

  var ui = {
    icon: function (n, size) {
      size = size || 18;
      return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || "") + "</svg>";
    },

    toast: function (pesan, tipe, ms) {
      var root = document.getElementById("toasts");
      if (!root) return;
      tipe = tipe || "info";
      var el = document.createElement("div");
      el.className = "toast toast-" + tipe;
      el.setAttribute("role", tipe === "error" ? "alert" : "status");
      var ik = tipe === "success" ? "check" : tipe === "error" ? "alert" : "info";
      el.innerHTML = ui.icon(ik, 18) + "<span>" + S.util.esc(pesan) + "</span>";
      root.appendChild(el);
      while (root.children.length > 3) root.firstChild.remove();
      setTimeout(function () { el.classList.add("hide"); setTimeout(function () { el.remove(); }, 250); }, ms || 3800);
    },

    /* Modal generik. opsi: {judul, isi(html), tombol:[{teks, kelas, onClick}], lebar} */
    modal: function (opsi) {
      var root = document.getElementById("modal-root");
      var wrap = document.createElement("div");
      wrap.className = "modal-backdrop";
      var btn = (opsi.tombol || []).map(function (t, i) {
        return '<button type="button" class="btn ' + (t.kelas || "btn-outline") + '" data-i="' + i + '">' + S.util.esc(t.teks) + "</button>";
      }).join("");
      wrap.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" style="max-width:' + (opsi.lebar || 520) + 'px">' +
        '<div class="modal-head"><h3>' + S.util.esc(opsi.judul || "") + '</h3><button type="button" class="icon-btn" data-close aria-label="Tutup">' + ui.icon("x") + "</button></div>" +
        '<div class="modal-body">' + (opsi.isi || "") + "</div>" +
        (btn ? '<div class="modal-foot">' + btn + "</div>" : "") + "</div>";
      root.appendChild(wrap);
      var api = { el: wrap, close: function () { wrap.remove(); document.removeEventListener("keydown", esc); } };
      function esc(e) { if (e.key === "Escape") api.close(); }
      document.addEventListener("keydown", esc);
      wrap.addEventListener("mousedown", function (e) { if (e.target === wrap) api.close(); });
      wrap.querySelector("[data-close]").onclick = api.close;
      wrap.querySelectorAll("[data-i]").forEach(function (b) {
        b.onclick = function () { var t = opsi.tombol[Number(b.dataset.i)]; if (t.onClick) t.onClick(api); else api.close(); };
      });
      var first = wrap.querySelector("input,select,textarea");
      if (first) first.focus();
      return api;
    },

    konfirmasi: function (o) {
      return new Promise(function (resolve) {
        ui.modal({
          judul: o.judul || "Konfirmasi", lebar: 440,
          isi: '<p class="muted-text">' + o.pesan + "</p>",
          tombol: [
            { teks: o.batal || "Batal", kelas: "btn-outline", onClick: function (m) { m.close(); resolve(false); } },
            { teks: o.ya || "Ya", kelas: o.bahaya ? "btn-danger" : "btn-primary", onClick: function (m) { m.close(); resolve(true); } },
          ],
        });
      });
    },
  };
  S.ui = ui;
})(window.SIPK);
