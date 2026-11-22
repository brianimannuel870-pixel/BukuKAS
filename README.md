# BukuKAS — Web Aplikasi Catatan Utang Piutang Modern

Aplikasi web pencatatan utang dan piutang yang dirancang dengan antarmuka modern, minimalis, bersih (*clean fintech UI/UX*), dan responsif penuh (desktop & mobile). Dilengkapi kalkulator bunga % flat real-time, pencatatan cicilan bertahap & pelunasan instan, manajemen tutup buku (*monthly closing*) bulanan, ekspor CSV, serta penyimpanan persisten cloud menggunakan **Neon Serverless Postgres** dan **Prisma ORM**.

---

## 🌟 Fitur Utama

### 1. Autentikasi & Keamanan Sesi
- **Halaman Login & Registrasi** (`/login`, `/register`) dengan tampilan *centered card* di atas latar `slate-50`.
- Password di-hash menggunakan algoritma `bcryptjs` (salt 10 rounds).
- Autentikasi sesi menggunakan JWT aman via HTTP-Only cookie.
- Proteksi route menyeluruh menggunakan Next.js `middleware.ts`.
- **Isolasi Data**: Seluruh query database difilter ketat berdasarkan `userId` dari sesi aktif.

### 2. Dashboard / Ringkasan (`/`)
- **Banner Status Tutup Buku**: Menampilkan periode aktif, tanggal tutup buku bulanan, dan hitung mundur (*countdown*) hari menuju jadwal berikutnya.
- **3 Kartu Metrik Utama**:
  1. **Total Piutang Aktif**: Akumulasi sisa tagihan piutang berjalan beserta jumlah transaksi aktif.
  2. **Pendapatan Bunga**: Potensi total bunga flat dilengkapi informasi **Bunga Terealisasi** yang dihitung proporsional dari pembayaran yang masuk.
  3. **Total Utang Aktif**: Akumulasi kewajiban utang berjalan beserta jumlah transaksi aktif.
- **Daftar Catatan Terbaru**: 5 transaksi terakhir dengan akses cepat tombol **Catat Bayar**.

### 3. Pencatatan Baru & Kalkulator Bunga Flat Real-Time
- *Segmented toggle*: **Piutang (Memberi)** atau **Utang (Menerima)**.
- Input data transaksi lengkap: Pihak/Peminjam, Tanggal, Pokok (Rp), Bunga Flat (%), Basis Bunga (`% / Bulan` atau `% Total`), Tenor (Bulan), dan Keterangan.
- **Simulasi Real-Time**:
  - `% / Bulan`: $\text{Total Bunga} = \text{Pokok} \times \frac{\text{Bunga}}{100} \times \text{Tenor}$
  - `% Total`: $\text{Total Bunga} = \text{Pokok} \times \frac{\text{Bunga}}{100}$
  - Menghitung otomatis **Total Bunga**, **Estimasi Cicilan per Bulan**, dan **Total Tagihan** sebelum disimpan ke database.

### 4. Riwayat Transaksi & Pembayaran (`/records`)
- Pencarian cerdas dan filter multi-kriteria: **Jenis** (*Semua, Piutang, Utang*) dan **Status** (*Semua, Belum Lunas, Lunas*).
- Indikator *progress bar* pelunasan dan badge status semantik.
- **Modal Catat Pembayaran**: Mendukung pembayaran cicilan bertahap, tombol cepat **Bayar Lunas**, riwayat pembayaran sebelumnya, serta animasi *confetti* saat tagihan lunas!
- **Ekspor CSV**: Unduh seluruh rekap catatan transaksi ke format spreadsheet `.csv`.

### 5. Kelola Tutup Buku / Closing Bulanan (`/closing`)
- **Pengaturan Tanggal Rutin**: Memilih tanggal `1`–`31` tersimpan di `User.closingDay`, dengan penyesuaian otomatis untuk bulan yang harinya lebih sedikit (seperti Februari 28/29).
- **Pratinjau & Eksekusi Tutup Buku**: Menghitung otomatis dari database: Piutang Baru, Pembayaran Masuk, Bunga Periode, dan Sisa Piutang Akhir.
- **Arsip Tutup Buku Bulanan**: Riwayat *snapshot* penutupan buku periode sebelumnya.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + `lucide-react` + Font `Inter`
- **Database & ORM**: Neon Serverless Postgres + Prisma ORM (`@prisma/client`)
- **Autentikasi**: JWT HTTP-Only Cookie + `bcryptjs` + `jose`
- **Validasi**: Zod

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Setup Environment Variables
Salin template `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi database Neon Postgres Anda di `.env`:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-super-secret-key-min-32-chars-long"
```

### 2. Migrasi Database & Seed Data
Generate Prisma Client dan sinkronkan skema ke Neon Postgres:
```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

> **Akun Demo Bawaan:**
> - Email: `demo@bukukas.id`
> - Password: `demo1234`

### 3. Menjalankan Aplikasi
Mode development:
```bash
npm run dev
```
Buka browser pada [http://localhost:3000](http://localhost:3000).

Mode produksi (Build):
```bash
npm run build
npm run start
```
