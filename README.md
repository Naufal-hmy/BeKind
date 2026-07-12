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

1. Masuk ke [Supabase Dashboard](https://supabase.com) dan buat proyek baru (_Create a new project_).
2. Tunggu hingga database selesai di-setup oleh Supabase.

### Langkah 2: Setup Tabel Database (SQL Editor)

1. Di dashboard Supabase proyek Anda, klik menu **SQL Editor** di panel kiri.
2. Klik **New Query** -> **Blank Query**.
3. Buka file [supabase_schema.sql](supabase_schema.sql) di folder proyek ini, salin seluruh isi teks SQL-nya, dan tempel (_paste_) ke SQL Editor di Supabase.
4. Klik tombol **Run** di pojok kanan bawah.
   _Ini akan membuat tabel `profiles`, `schedules`, `missions`, `suggestions`, `completed_missions`, mengonfigurasi RLS (Row Level Security), dan memasukkan data misi awal._

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

### Flow Aplikasi

🗺️ Peta Alur Utama Aplikasi (High-Level Diagram)
Mermaid diagram

1. Proses Masuk & Deteksi Peran (Auth Flow)
   Halaman Login: Pengguna memasukkan email/username dan kata sandi di
   AuthScreen.tsx
   .
   Cabang Peran (Role Routing):
   Administrator: Masuk menggunakan username admin dan password admin. Sistem otomatis mendeteksi role admin dan mengarahkannya ke EO Admin Panel untuk memantau verifikasi bukti misi global, mengelola sengketa (CS), serta melakukan operasi CRUD pada daftar misi sistem.
   User Biasa: Masuk dengan akun pribadi. Sistem mengarahkannya ke halaman utama yang memiliki 5 Tab Navigasi.
2. Tab Utama User (Main Application Flow)
   A. Tab Dashboard (Explore)
   Menampilkan ringkasan profil pengguna, jumlah Aura Points, level empati, dan streak harian.
   Sobat Peka (Kindness Agent): Algoritma agen pintar yang membaca celah kosong pada jadwal agenda harian pengguna dan langsung menyarankan misi kebaikan yang cocok di area terdekat.
   B. Tab Radar (Map)
   Menampilkan peta dengan gaya cyberpunk holographic.
   Sistem mendeteksi lokasi GPS riil pengguna. Jika radar mendeteksi tidak ada misi di dekat pengguna (misalnya saat simulasi di Jakarta Pusat), sistem secara otomatis melakukan auto-seeding (memunculkan pin misi baru) di sekitar wilayah tersebut.
   Pengguna dapat menekan pin misi kebaikan di peta, membaca detailnya, dan menekan "Jadikan Misi Aktif" untuk memfokuskan pengerjaan.
   C. Tab Agenda & Kalender (Schedule)
   Kalender interaktif berbentuk grid sebulan penuh. Hari yang memiliki kegiatan ditandai dengan titik warna (Dot Indicator):
   🟢 Sibuk Mandiri (Kegiatan rutin harian seperti kuliah/kerja).
   🟠 Misi Personal (Agenda kebaikan mandiri).
   🟣 Misi Publik (Misi berbayar yang dibuat pengguna lain).
   🟡 Misi Event (Kegiatan sosial berskala besar).
   Misi yang dibuat pengguna secara otomatis muncul sebagai agenda batas waktu (deadline) di kalender ini lengkap dengan ikon lokasi 📍.
   Jadwal mendeteksi status keaktifan secara real-time: ⏳ Kadaluarsa (waktu habis) atau ⚠️ Hampir Selesai (kurang dari 30 menit).
   D. Tab Leaderboard (Papan Peringkat)
   Menampilkan daftar peringkat pengguna dengan Aura Points terbanyak di komunitas BeKind untuk memacu semangat kompetitif yang positif.
   E. Tab Profil (Pembuatan & Publikasi Misi)
   Di sinilah tempat pengguna mengelola akun, melihat riwayat misi, dan menerbitkan misi baru.
   Alur Pembuatan Misi Baru (Map Picker & Pembayaran):
   Pengguna menekan tombol "Buat Misi Baru".
   Memilih tipe misi:
   Personal (Gratis): Berfungsi sebagai alarm pengingat kebaikan pribadi (tidak memotong Aura).
   Publik (Berbayar): Misi yang dilempar ke peta global agar bisa dikerjakan oleh orang lain (pekerja/helper).
   Location Picker Peta: Pengguna menekan tombol 📍 Pilih dari Peta yang membuka peta interaktif. Pengguna menggeser pin ke lokasi target. Sistem secara offline melakukan kalkulasi jarak ke landmark terdekat (seperti Monas, Bundaran HI, atau Gedung Sate) dan otomatis mengisi nama lokasinya secara cerdas.
   Metode Pembayaran Misi Publik (Posting Fee 100 Aura):
   Untuk menerbitkan misi publik, pembuat dikenakan biaya posting sebesar 100 Aura Points (potong saldo) atau Rp15.000 via Scan QRIS (terdapat simulasi QRIS).
   Pembuat juga menentukan berapa Aura Points Hadiah yang akan diterima oleh orang lain (pekerja) yang menyelesaikan misi tersebut (misal: +50 Aura).
   Misi disimpan di Supabase dan langsung tayang di Radar Map pengguna lain.
3. Alur Penyelesaian Misi & Reward (Helper & Verification Flow)

[Pekerja ambil misi publik di peta]
│
▼
[Lakukan aksi kebaikan di lokasi riil]
│
▼
[Buka kamera & ambil foto bukti dengan filter anti-cheat]
│
▼
[Kirim verifikasi bukti ke admin]
│
▼
[Admin memeriksa di EO Panel -> Approve]
│
▼
[Pekerja mendapatkan reward Aura Points sesuai janji pembuat misi]
Pengambilan Misi: Sukarelawan melihat misi publik di peta radar mereka lalu menandainya sebagai misi aktif.
Eksekusi Aksi: Sukarelawan mendatangi lokasi dan melakukan aksi kebaikan yang diminta.
Perekaman Bukti (Kamera Anti-Cheat): Helper membuka fitur kamera di aplikasi BeKind untuk mengambil foto bukti. Kamera dilengkapi filter khusus (seperti filter Hewan, Sosial, atau Lingkungan) untuk memastikan bukti yang dikirimkan otentik.
Verifikasi Bukti: Bukti foto dikirim ke database. Administrator mendeteksi pengajuan ini pada EO Panel mereka, melakukan verifikasi kecocokan foto, lalu menyetujuinya (Approve).
Pencairan Reward: Setelah disetujui, pekerja/helper otomatis mendapatkan tambahan Aura Points ke saldo akun mereka, dan level empati mereka akan meningkat!
💡 Jawaban Singkat Pertanyaan Aura Points
Kenapa ada 100 Aura untuk pembayaran penerbitan misi, dan ada lagi Aura Points untuk Pekerja?

100 Aura Points (Biaya Penerbitan): Adalah tarif pembuatan iklan/misi publik baru. Ini ditarik dari Anda sebagai pencipta misi untuk membiayakan server sistem dan menyaring spam (agar tidak ada orang yang membuat ribuan misi sampah secara gratis).
Aura Points untuk Pekerja (Hadiah): Adalah upah/hadiah yang akan didapatkan oleh sukarelawan yang menyelesaikan tugas Anda. Hadiah ini dikreditkan langsung ke akun mereka sebagai insentif atas kebaikannya.

[Link Gambar Flow Aplikasi:](https://drive.google.com/file/d/1bhQARUzBF9U4bNREDB3-3-1yg6yWFE7Y/view?usp=sharing)
