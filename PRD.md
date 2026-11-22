# Product Requirements Document (PRD)
## BukuKAS — Aplikasi Web Catatan Utang Piutang

**Versi:** 1.0  
**Nama Produk:** BukuKAS  
**Platform:** Web Application (Desktop & Mobile Responsive)  
**Tech Stack Utama:** Next.js (App Router), TypeScript, Tailwind CSS, Neon Postgres, Prisma ORM  

---

## 1. Ringkasan Eksekutif & Tujuan Produk

**BukuKAS** adalah aplikasi web pencatatan utang dan piutang yang dirancang dengan antarmuka minimalis, bersih (*clean UI/UX*), dan modern. Aplikasi ini membantu pemilik UMKM, pengelola kas, maupun individu untuk mencatat transaksi utang/piutang dengan skema perhitungan **bunga % flat**, memantau **total piutang dan pendapatan bunga**, serta mengelola **tutup buku (*monthly closing*) bulanan** secara terstruktur.

Seluruh data pengguna disimpan secara persisten dan aman di cloud menggunakan **Neon Serverless Postgres** serta dilindungi oleh sistem **autentikasi (Login & Registrasi)**.

---

## 2. Target Pengguna

1. **Pemilik UMKM / Pengusaha Mikro:** Membutuhkan pencatatan tempo pembayaran pelanggan/supplier dan pinjaman modal dengan bunga flat yang mudah dipantau dari HP maupun laptop.
2. **Pengelola Kas / Koperasi Kecil:** Membutuhkan rekap bulanan (tutup buku) untuk mengetahui uang masuk, pendapatan bunga, dan sisa piutang tiap periode.
3. **Individu:** Membutuhkan catatan pinjam-meminjam pribadi yang rapi dan tidak hilang saat berganti perangkat.

---

## 3. Arsitektur Teknis & Tech Stack

| Komponen | Teknologi yang Digunakan | Keterangan |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) + TypeScript | Fullstack React framework dengan Server Components & Server Actions / Route Handlers |
| **Styling & UI** | Tailwind CSS + `lucide-react` | Desain minimalis modern, font `Inter` via `next/font/google` |
| **Database** | **Neon Postgres** (Serverless PostgreSQL) | Penyimpanan cloud persisten menggunakan `DATABASE_URL` (pooled & direct URL) |
| **ORM** | Prisma ORM (`@prisma/client`) | Skema terstruktur, migrasi mudah, dan *type-safe queries* |
| **Autentikasi** | Auth.js / NextAuth.js (v5) atau JWT HTTP-Only Cookie | Login menggunakan Email & Password (`bcryptjs` untuk hashing password) |
| **Validasi** | Zod | Validasi input form di sisi klien maupun server |

---

## 4. Skema Database (Neon Postgres)

Berikut rancangan relasi tabel utama pada database Neon Postgres:

### 4.1 Tabel `users`
Menyimpan kredensial pengguna dan preferensi tanggal tutup buku.
- `id`: `String` (UUID / CUID, Primary Key)
- `name`: `String` (Nama lengkap pengguna)
- `email`: `String` (Unique)
- `passwordHash`: `String` (Hash password dengan `bcryptjs`)
- `closingDay`: `Int` (Default: `28`, rentang `1`–`31`)
- `createdAt`: `DateTime`
- `updatedAt`: `DateTime`

### 4.2 Tabel `records` (Utang & Piutang)
Menyimpan setiap transaksi utang atau piutang milik pengguna.
- `id`: `String` (UUID / CUID, Primary Key)
- `userId`: `String` (Foreign Key $\rightarrow$ `users.id`, Cascade Delete)
- `type`: `Enum` (`PIUTANG`, `UTANG`)
- `partyName`: `String` (Nama peminjam / pemberi pinjaman)
- `transactionDate`: `DateTime` (Tanggal transaksi)
- `principal`: `Decimal` / `BigInt` (Nominal pokok dalam Rupiah)
- `interestRate`: `Float` (Persentase bunga flat)
- `rateMode`: `Enum` (`PER_BULAN`, `TOTAL`)
- `tenorMonths`: `Int` (Tenor dalam bulan, minimal `1`)
- `totalInterest`: `Decimal` / `BigInt` (Hasil perhitungan total bunga flat)
- `totalAmount`: `Decimal` / `BigInt` (Pokok + Total Bunga)
- `paidAmount`: `Decimal` / `BigInt` (Default: `0`, total nominal yang sudah dibayar)
- `note`: `String?` (Keterangan opsional)
- `createdAt`: `DateTime`
- `updatedAt`: `DateTime`

### 4.3 Tabel `payments` (Riwayat Pembayaran)
Menyimpan catatan pembayaran cicilan maupun pelunasan untuk setiap transaksi.
- `id`: `String` (UUID / CUID, Primary Key)
- `recordId`: `String` (Foreign Key $\rightarrow$ `records.id`, Cascade Delete)
- `amount`: `Decimal` / `BigInt` (Nominal yang dibayarkan)
- `paymentDate`: `DateTime` (Tanggal pembayaran)
- `createdAt`: `DateTime`

### 4.4 Tabel `monthly_closings` (Arsip Tutup Buku Bulanan)
Menyimpan *snapshot* laporan tutup buku tiap periode bulan per pengguna.
- `id`: `String` (UUID / CUID, Primary Key)
- `userId`: `String` (Foreign Key $\rightarrow$ `users.id`, Cascade Delete)
- `period`: `String` (Format `YYYY-MM`, Unique constraint bersama `userId`)
- `closingDaySetting`: `Int` (Tanggal tutup buku yang berlaku saat closing)
- `closedAt`: `DateTime` (Waktu eksekusi tutup buku)
- `newReceivables`: `Decimal` / `BigInt` (Total piutang baru di periode tersebut)
- `incomingPayments`: `Decimal` / `BigInt` (Total pembayaran masuk di periode tersebut)
- `periodInterest`: `Decimal` / `BigInt` (Total bunga dari piutang baru periode tersebut)
- `endingReceivables`: `Decimal` / `BigInt` (Sisa total piutang akhir)
- `endingPayables`: `Decimal` / `BigInt` (Sisa total utang akhir)

---

## 5. Spesifikasi Fitur & Fungsionalitas

### 5.1 Halaman Login & Registrasi (`/login`, `/register`)
- **Halaman Login (`/login`):**
  - Tampilan minimalis terpusat (*centered card*) pada latar belakang `slate-50` dengan logo **BukuKAS**.
  - Input **Email** dan **Password** (dilengkapi tombol *toggle show/hide password*).
  - Pesan error yang jelas jika kredensial salah atau format tidak valid.
  - Tombol **Masuk** dengan *loading state* saat autentikasi berlangsung.
  - Tautan menuju halaman **Daftar Akun Baru (`/register`)**.
- **Halaman Registrasi (`/register`):**
  - Input: **Nama Lengkap**, **Email**, **Password** (minimal 6 karakter), dan **Konfirmasi Password**.
  - Validasi duplikasi email pada Neon Postgres.
  - Setelah registrasi berhasil, pengguna diarahkan langsung masuk ke Dashboard atau ke halaman Login dengan notifikasi sukses.
- **Proteksi Route & Sesi:**
  - Next.js Middleware melindungi seluruh halaman utama (`/`, `/riwayat`, `/tutup-buku`) dan API endpoints; pengguna yang belum login otomatis diarahkan ke `/login`.
  - Pengguna yang sudah login akan diarahkan ke `/` jika mengakses `/login` atau `/register`.
  - Tersedia menu profil/tombol **Keluar (Logout)** pada header navigasi.
- **Seed Akun Demo (Opsional untuk Development):**
  - Script seed Prisma menyediakan 1 akun demo (misal `demo@bukukas.id` / `demo1234`) beserta beberapa transaksi contoh agar aplikasi langsung siap diuji.

### 5.2 Dashboard / Ringkasan (`/`)
- **Banner Status Tutup Buku:**
  - Menampilkan tanggal tutup buku rutin bulanan pengguna (misal: `Tutup Buku: Tgl 28`).
  - Menampilkan hitung mundur (*countdown*) otomatis berapa hari lagi menuju jadwal tutup buku berikutnya.
  - Tombol pintasan menuju tab/halaman **Kelola Tutup Buku**.
- **Kartu Metrik Utama (3 Kartu):**
  1. **Total Piutang Aktif:** Akumulasi sisa tagihan (`totalAmount - paidAmount`) dari seluruh piutang yang belum lunas, beserta jumlah transaksi aktif.
  2. **Pendapatan Bunga:** Total potensi pendapatan bunga flat dari seluruh piutang, dilengkapi informasi **Bunga Terealisasi** yang dihitung proporsional:
     $$\text{Bunga Terealisasi} = \text{Total Bunga} \times \min\left(1, \frac{\text{Terbayar}}{\text{Total Tagihan}}\right)$$
  3. **Total Utang Aktif:** Akumulasi sisa kewajiban utang yang belum lunas, beserta jumlah transaksi aktif.
- **Daftar Catatan Terbaru:**
  - Menampilkan 5 transaksi terbaru dengan tombol cepat **Catat Bayar** untuk transaksi yang masih berjalan.

### 5.3 Pencatatan Baru & Kalkulator Bunga % Flat (Modal/Drawer)
- *Segmented toggle* untuk memilih jenis: **Piutang (Memberi)** atau **Utang (Menerima)**.
- Input: Nama Pihak/Peminjam, Tanggal Transaksi, Nominal Pokok (`Rp`), Bunga Flat (`%`), Basis Bunga (`% / Bulan` atau `% Total`), Tenor (`Bulan`), dan Keterangan opsional.
- **Perhitungan Otomatis (Real-Time Preview):**
  - Jika basis `% / Bulan`:
    $$\text{Total Bunga} = \text{Pokok} \times \frac{\text{Bunga}}{100} \times \text{Tenor}$$
  - Jika basis `% Total`:
    $$\text{Total Bunga} = \text{Pokok} \times \frac{\text{Bunga}}{100}$$
  - Total Tagihan:
    $$\text{Total Tagihan} = \text{Pokok} + \text{Total Bunga}$$
  - Estimasi Cicilan per Bulan:
    $$\text{Estimasi Cicilan} = \frac{\text{Total Tagihan}}{\text{Tenor}}$$
- Data disimpan langsung ke tabel `records` di Neon Postgres.

### 5.4 Riwayat / List Transaksi & Pembayaran
- **Pencarian & Filter:** Pencarian berdasarkan nama pihak/keterangan, filter **Jenis** (`Semua`, `Piutang`, `Utang`), dan filter **Status** (`Semua`, `Belum Lunas`, `Lunas`).
- **Kartu Transaksi:** Menampilkan badge jenis & status, rincian Pokok, Bunga Flat, Terbayar (`%`), *progress bar* pelunasan, tombol **Catat Bayar / Detail Bayar**, dan tombol **Hapus** (dengan modal konfirmasi).
- **Modal Catat Pembayaran:**
  - Menampilkan ringkasan Total Tagihan, Sudah Dibayar, dan Sisa Tagihan.
  - Input nominal pembayaran + tombol pintasan **Bayar Lunas** + tanggal pembayaran.
  - Menampilkan daftar riwayat pembayaran sebelumnya dari tabel `payments`.
  - Penyimpanan pembayaran dilakukan dalam *database transaction* Prisma (`prisma.$transaction`) agar penambahan baris di `payments` dan pembaruan `paidAmount` di `records` selalu konsisten.
- **Ekspor CSV:** Mengunduh daftar transaksi ke file `.csv`.

### 5.5 Tanggal Tutup Buku / Closing Bulanan
- **Pengaturan Tanggal Tutup Buku:** Pemilih tanggal `1`–`31` yang disimpan ke kolom `closingDay` pada tabel `users`. Otomatis menyesuaikan ke hari terakhir bulan untuk bulan yang harinya lebih sedikit (misal Februari).
- **Pratinjau & Proses Tutup Buku:**
  - Pemilih periode bulan (`YYYY-MM`) yang langsung menghitung dari database: Piutang Baru, Pembayaran Masuk, Bunga Periode, dan Sisa Piutang Akhir.
  - Tombol **Proses Tutup Buku** (atau **Perbarui Tutup Buku** jika periode sudah pernah ditutup) yang melakukan `upsert` ke tabel `monthly_closings`.
- **Arsip Tutup Buku:** Menampilkan daftar laporan periode yang telah ditutup beserta rincian angkanya.

---

## 6. Desain Sistem & Panduan UI/UX

- **Estetika:** Minimalis modern (*clean fintech/SaaS*), ruang kosong (*whitespace*) lega, kartu putih (`bg-white`) di atas latar belakang `bg-slate-50`, border halus (`border-slate-200/80`), sudut membulat (`rounded-2xl`).
- **Palet Warna Semantik:**
  - Utama / Aksi Primer: `slate-900`
  - Piutang / Pelunasan / Masuk: `emerald-600` & `emerald-50`
  - Pendapatan Bunga: `indigo-600` & `indigo-50`
  - Utang / Hapus / Peringatan: `rose-600` & `rose-50`
- **Responsivitas:**
  - **Desktop:** Navigasi tab di *top header* bersama profil & tombol Logout.
  - **Mobile:** *Fixed bottom navigation bar* untuk berpindah cepat antara Ringkasan, Riwayat, dan Tutup Buku, serta modal bergaya *bottom sheet* di layar kecil.
- **Lokalisasi:** Seluruh angka mata uang menggunakan format Rupiah (`Rp 1.000.000`) dan tanggal dalam format Indonesia (`22 Nov 2026`).
- **Feedback:** Notifikasi *toast* minimalis untuk setiap aksi berhasil/gagal serta *loading skeleton/spinner* saat memuat data dari Neon Postgres.

---

## 7. Kebutuhan Non-Fungsional & Keamanan

1. **Isolasi Data Pengguna (*Authorization*):** Setiap query ke `records`, `payments`, dan `monthly_closings` wajib memfilter berdasarkan `userId` dari sesi yang aktif agar pengguna tidak dapat mengakses atau memodifikasi data pengguna lain.
2. **Keamanan Password:** Password tidak pernah disimpan dalam bentuk teks biasa; wajib di-hash dengan `bcryptjs` (minimal 10 salt rounds).
3. **Konfigurasi Environment (`.env`):**
   - `DATABASE_URL`: Connection string Neon Postgres (pooled).
   - `DIRECT_URL`: Direct connection string Neon Postgres (untuk migrasi Prisma).
   - `AUTH_SECRET`: Secret key acak untuk enkripsi sesi/JWT.
4. **Integritas Data:** Pembayaran cicilan tidak boleh melebihi sisa tagihan dan wajib dieksekusi dalam transaksi atomik database.

---

## 8. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Pengguna dapat mendaftar akun baru di `/register` dan masuk melalui `/login`.
- [ ] Akses ke halaman utama tanpa login otomatis diarahkan ke `/login`.
- [ ] Pencatatan piutang/utang baru dengan bunga flat tersimpan di Neon Postgres dan tetap ada setelah *refresh* atau login dari perangkat lain.
- [ ] Kartu Total Piutang Aktif, Pendapatan Bunga (beserta Bunga Terealisasi), dan Total Utang Aktif terhitung akurat dari data database.
- [ ] Pembayaran cicilan dan pelunasan memperbarui status transaksi serta tercatat di riwayat pembayaran.
- [ ] Pengaturan tanggal tutup buku dan proses *monthly closing* tersimpan di Neon Postgres dan tampil di arsip.
- [ ] Aplikasi berjalan mulus tanpa error pada `npm run build` dan responsif di layar mobile maupun desktop.