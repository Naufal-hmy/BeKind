# BeKind - Kindness Reminder Agent 🌟

Aplikasi mobile berbasis **React Native (Expo)** yang berfungsi sebagai asisten kebaikan otonom. Aplikasi ini secara otomatis memantau waktu luang (kalender kesibukan) dan lokasi GPS pengguna untuk memberikan rekomendasi aksi sosial ringan terdekat (seperti memberi makan kucing liar, melariskan pedagang sepi, dll).

---

## 🛠️ Tech Stack

- **Framework**: React Native (Expo SDK 56) dengan Expo Router
- **Database & Auth**: Supabase (PostgreSQL)
- **Real-time Engine**: Supabase Real-time Subscriptions (untuk notifikasi asisten)
- **Fitur Native**:
  - `expo-location` (GPS & Lokasi terintegrasi)
  - `react-native-maps` (Peta Peka / Navigasi Aksi)
  - `expo-image-picker` & Kamera Simulasi (Foto bukti aksi kebaikan)
  - `expo-notifications` (Notifikasi push lokal ketika ada misi baru)
- **Penyimpanan Lokal**: `@react-native-async-storage/async-storage` (sebagai fallback Demo Mode)

---

## 🚀 Cara Menjalankan Aplikasi

1. **Clone & Install Dependensi**:
   Buka terminal di folder proyek ini, lalu jalankan:
   ```bash
   npm install
   ```

2. **Jalankan Aplikasi**:
   Jalankan server Expo:
   ```bash
   npm start
   ```
   Pindai QR Code menggunakan aplikasi **Expo Go** di perangkat Android atau iOS Anda.

---

## 🔗 Cara Menghubungkan ke Supabase

Untuk menghubungkan database online Supabase ke aplikasi BeKind Anda, ikuti langkah-langkah berikut:

### Langkah 1: Siapkan Proyek Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com) dan buat proyek baru (*Create a new project*).
2. Tunggu hingga database selesai di-setup oleh Supabase.

### Langkah 2: Setup Tabel Database (SQL Editor)
1. Di dashboard Supabase proyek Anda, klik menu **SQL Editor** di panel kiri.
2. Klik **New Query** -> **Blank Query**.
3. Buka file [supabase_schema.sql](supabase_schema.sql) di folder proyek ini, salin seluruh isi teks SQL-nya, dan tempel (*paste*) ke SQL Editor di Supabase.
4. Klik tombol **Run** di pojok kanan bawah.
   *Ini akan membuat tabel `profiles`, `schedules`, `missions`, `suggestions`, `completed_missions`, mengonfigurasi RLS (Row Level Security), dan memasukkan data misi awal.*

### Langkah 3: Konfigurasi Environment Variables di Aplikasi
1. Di folder utama proyek ini, buat berkas baru dengan nama `.env`.
2. Salin isi dari berkas [.env.example](.env.example) ke berkas `.env` tersebut.
3. Di dashboard Supabase Anda, buka **Project Settings** (ikon gerigi di kiri bawah) -> **API**.
4. Salin **Project URL** dan tempelkan ke variabel `EXPO_PUBLIC_SUPABASE_URL` di berkas `.env`.
5. Salin **anon / public API key** dan tempelkan ke variabel `EXPO_PUBLIC_SUPABASE_ANON_KEY` di berkas `.env`.

Contoh isi berkas `.env` Anda:
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcde12345.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

### Langkah 4: Restart Server Expo
Matikan server Expo jika sedang berjalan (`Ctrl + C` di terminal) lalu jalankan kembali menggunakan `npm start`. Aplikasi sekarang sudah terhubung langsung secara real-time ke Supabase!

> [!NOTE]
> **Demo Mode / Fallback**: Jika file `.env` tidak dibuat atau kredensial kosong, aplikasi akan secara otomatis masuk ke **Demo Mode**. Aplikasi akan berjalan menggunakan data lokal (`AsyncStorage`) dan mensimulasikan semua interaksi otonom/kamera secara offline agar presentasi/uji coba UI tetap dapat dilakukan secara instan tanpa hambatan.
