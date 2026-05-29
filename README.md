# YUK SUKSES - Aplikasi Registrasi Karyawan

YUK SUKSES adalah aplikasi web sederhana untuk mencatat, mengelola, dan melihat data karyawan dalam satu dashboard yang rapi. Proyek ini cocok untuk latihan fullstack dasar karena menggabungkan halaman HTML, styling responsif, interaksi JavaScript, backend Express, dan API CRUD.

## Gambaran Aplikasi

Aplikasi ini dibuat seperti sistem HR mini untuk tim kecil. Pengguna bisa membuka dashboard, melihat ringkasan data, mencari karyawan, menambahkan data baru, mengubah data, menghapus data, serta mengekspor atau mengimpor data CSV.

Tujuan utamanya bukan hanya menampilkan form, tetapi memberi pengalaman aplikasi yang terasa utuh: ada dashboard, halaman registrasi khusus, mode gelap, data awal, validasi input, dan koneksi API.

## Demo

Production:

```text
https://yuksukses.vercel.app
```

Halaman registrasi:

```text
https://yuksukses.vercel.app/registrasi
```

## Fitur Utama

- Dashboard karyawan dengan tabel data yang mudah dipindai
- Statistik ringkas: total karyawan, departemen, jabatan, dan karyawan baru
- Halaman registrasi karyawan baru
- Tambah, edit, dan hapus data karyawan
- Validasi form agar data yang masuk lebih rapi
- Pencarian data karyawan secara cepat
- Filter dan tampilan yang responsif
- Impor dan ekspor CSV
- Mode terang dan gelap
- Backend Express dengan endpoint API sederhana
- Deploy-ready untuk Vercel

## Alur Penggunaan

1. Pengguna membuka dashboard utama.
2. Aplikasi mengambil data karyawan dari endpoint `/api/employees`.
3. Data ditampilkan dalam tabel dan kartu statistik.
4. Pengguna bisa mencari, menambah, mengedit, atau menghapus karyawan.
5. Saat data berubah, frontend mengirim request ke backend.
6. Backend memperbarui data dan mengirim respons terbaru ke frontend.

## Struktur Proyek

- `index.html` - halaman dashboard utama
- `registrasi.html` - halaman registrasi karyawan baru
- `style.css` - styling utama, responsif, tema terang/gelap
- `script.js` - logika frontend, validasi, render data, dan request API
- `server.js` - backend Express untuk menjalankan API
- `api/index.js` - entry point serverless function untuk Vercel
- `db.json` - data lokal sederhana untuk mode development
- `vercel.json` - konfigurasi rewrite route Vercel
- `package.json` - metadata proyek dan dependency

## Teknologi

- HTML
- CSS
- Tailwind CDN
- JavaScript
- Node.js
- Express
- Vercel Serverless Function
- JSON file sebagai database lokal sederhana

## Cara Menjalankan di Lokal

Pastikan Node.js sudah terpasang.

1. Install dependency:

   ```bash
   npm install
   ```

2. Jalankan server:

   ```bash
   npm start
   ```

3. Buka aplikasi:

   ```text
   http://localhost:3000
   ```

4. Buka halaman registrasi:

   ```text
   http://localhost:3000/registrasi.html
   ```

## Endpoint API

Backend menyediakan endpoint berikut:

- `GET /api/employees` - mengambil semua data karyawan
- `POST /api/employees` - menambahkan data karyawan baru
- `PUT /api/employees/:id` - memperbarui data karyawan berdasarkan ID
- `DELETE /api/employees/:id` - menghapus data karyawan berdasarkan ID

Contoh data karyawan:

```json
{
  "id": "EMP-2026-0001",
  "nama": "Andi Prasetyo",
  "email": "andi.prasetyo@hrsync.id",
  "telepon": "08123456789",
  "jabatan": "Senior Software Engineer",
  "departemen": "Engineering",
  "tanggal": "2022-03-15"
}
```

## Catatan Deploy Vercel

Project ini sudah disiapkan untuk Vercel dengan pola:

- File frontend dilayani sebagai static files
- Endpoint `/api/*` diarahkan ke `api/index.js`
- Express diekspor sebagai serverless function
- Route `/registrasi` diarahkan ke `registrasi.html`

Pastikan **Root Directory** di Vercel kosong atau `./`, karena semua file utama berada di root repository.

## Catatan Database

Saat dijalankan lokal, aplikasi memakai `db.json` sebagai database sederhana. Ini cocok untuk belajar dan demo lokal.

Di Vercel, filesystem serverless tidak cocok untuk penyimpanan permanen. Aplikasi tetap bisa berjalan untuk demo, tetapi data yang ditulis di runtime tidak dijamin tersimpan selamanya. Untuk versi produksi yang serius, gunakan database seperti Supabase, Neon, MongoDB Atlas, atau Vercel Postgres.

## Cocok Untuk

- Pelajar yang sedang belajar HTML, CSS, JavaScript, dan Express
- Latihan membuat aplikasi CRUD sederhana
- Contoh project fullstack ringan untuk portfolio
- Demo sistem registrasi karyawan berbasis web
- Eksperimen deploy frontend dan backend sederhana ke Vercel

## Ide Pengembangan Lanjutan

- Login admin
- Role user dan permission
- Database permanen
- Upload foto karyawan
- Detail profil karyawan
- Export PDF
- Pagination dari backend
- Dashboard analytics yang lebih lengkap
- Validasi backend yang lebih ketat

## Ringkasan

YUK SUKSES adalah project kecil yang dirancang agar terasa seperti aplikasi nyata. Kodenya tetap sederhana, tetapi fiturnya cukup lengkap untuk memahami bagaimana frontend, backend, API, dan deploy saling terhubung.
