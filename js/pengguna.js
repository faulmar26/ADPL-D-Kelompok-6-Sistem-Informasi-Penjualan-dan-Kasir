(function (S) {
  "use strict";
  var U = S.util, ui = S.ui;

  /* Halaman Kelola Pengguna (khusus Operator): lihat akun dan aktif/nonaktifkan */
  S.pages.user = function (root) {
    function gambar() {
      var db = S.db.muat(), saya = S.auth.pengguna();
      root.querySelector("#tbody").innerHTML = db.users.map(function (u) {
        var diri = u.id === saya.id;
        return "<tr" + (u.aktif ? "" : ' class="row-muted"') + '><td><div class="user-cell"><span class="avatar sm av-' + u.peran + '">' + U.esc(u.nama.charAt(0)) + "</span><strong>" + U.esc(u.nama) + "</strong></div></td><td>" + U.esc(u.username) +
          '</td><td><span class="role-pill role-' + u.peran + '">' + S.namaPeran[u.peran] + "</span></td><td>" +
          (u.aktif ? '<span class="badge badge-ok">Aktif</span>' : '<span class="badge badge-muted">Nonaktif</span>') +
          '</td><td class="aksi"><button class="btn btn-outline btn-sm" data-toggle="' + u.id + '"' + (diri ? " disabled title=\"Akun yang sedang dipakai tidak bisa dinonaktifkan\"" : "") + ">" + (u.aktif ? "Nonaktifkan" : "Aktifkan") + "</button></td></tr>";
      }).join("");
      root.querySelector("#jumlah").textContent = db.users.length + " akun terdaftar";
      root.querySelectorAll("[data-toggle]").forEach(function (b) {
        b.onclick = function () {
          var u = S.db.userById(Number(b.dataset.toggle));
          u.aktif = !u.aktif; S.db.simpan();
          ui.toast("Akun " + u.username + (u.aktif ? " diaktifkan" : " dinonaktifkan"), "success");
          gambar();
        };
      });
    }
    root.innerHTML = '<div class="page-head"><div><h2>Kelola Pengguna</h2><p class="muted-text">Daftar akun admin, kasir, pemilik, dan operator. <span id="jumlah"></span></p></div></div>' +
      '<div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Status</th><th class="aksi">Aksi</th></tr></thead><tbody id="tbody"></tbody></table></div></div>';
    gambar();
  };
})(window.SIPK);
