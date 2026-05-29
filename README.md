# WEB REGISTRASI KARYAWAN SEDERHANA

Aplikasi ini sekarang memiliki backend lokal sederhana yang menyimpan data karyawan ke file `db.json`.

## Jalankan aplikasi

1. Buka terminal di folder proyek.
2. Jalankan:
   ```bash
   npm install
   npm start
   ```
3. Buka browser di:
   ```
   http://localhost:3000
   ```

## Fitur backend

- `GET /api/employees` — ambil semua data karyawan
- `POST /api/employees` — tambah karyawan baru
- `PUT /api/employees/:id` — perbarui data karyawan
- `DELETE /api/employees/:id` — hapus karyawan

Data disimpan dalam `db.json` agar tetap tersedia antar sesi.
