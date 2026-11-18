# NEXUS — Creative Immersive Portfolio

Starter project portofolio NEXUS yang dapat dijalankan secara lokal dan di-deploy ke **Vercel**. Dibangun menggunakan Next.js App Router, TypeScript, Framer Motion, Supabase Auth, PostgreSQL, Storage, dan Row Level Security (RLS).

> Portal/orb pada versi ini menggunakan animasi CSS 3D-inspired agar ringan dan responsif. Ini belum merupakan model 3D WebGL/Three.js penuh.

## 1. Persyaratan

- Node.js **22.x** (sesuai `.nvmrc` dan `package.json`)
- npm 10 atau versi kompatibel
- Akun Supabase
- Akun GitHub dan Vercel untuk deployment melalui Git

## 2. Persiapan Supabase

1. Buat project baru di [Supabase](https://supabase.com/).
2. Buka **Project Settings → API** atau dialog **Connect**.
3. Salin **Project URL** dan **Publishable Key**.
4. Buka **SQL Editor**.
5. Jalankan seluruh isi file `supabase/migrations/001_initial_schema.sql`.

Migration tersebut membuat tabel, relasi, index, helper function, policy RLS, dan bucket Storage:

- `portfolio-images`
- `portfolio-certificates`

Bucket dibuat public-readable karena file yang diunggah ditujukan untuk ditampilkan di portofolio publik. Operasi upload, update, dan delete dibatasi untuk admin melalui policy Storage. Jangan simpan dokumen privat di bucket ini.

### Membuat akun administrator pertama

1. Di Supabase, buka **Authentication → Users**.
2. Pilih **Add user** dan buat email/password admin. Jangan aktifkan public sign-up.
3. Salin UUID user tersebut.
4. Jalankan query berikut di SQL Editor dan ganti UUID contoh:

```sql
insert into public.admin_users (user_id, role)
values ('UUID-AKUN-ADMIN-KAMU', 'owner');
```

Akun hanya menjadi administrator jika memiliki user Auth dan baris yang sesuai di `public.admin_users`.

## 3. Menjalankan di komputer sendiri

Install dependency:

```bash
npm install
```

Buat `.env.local` dari `.env.example`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Jalankan development server:

```bash
npm run dev
```

Buka `http://localhost:3000`.

Perintah pemeriksaan:

```bash
npm run typecheck
npm run lint
npm run build
```

## 4. Deploy ke Vercel melalui GitHub

Project ini menggunakan Next.js App Router. Vercel mendukung Next.js secara langsung, sehingga tidak perlu mengubah output directory menjadi `out` atau membuat konfigurasi static export. File `vercel.json` sudah menetapkan framework sebagai `nextjs`.

### A. Upload project ke GitHub

1. Buat repository baru di GitHub.
2. Upload **isi folder `nexus-portfolio`** ke root repository. Pastikan `package.json`, `app/`, `components/`, `lib/`, dan `supabase/` berada langsung di root repository.
3. Jangan upload `.env.local`, `node_modules`, `.next`, atau folder `.vercel`.
4. Commit dan push ke branch `main`.

Jika menggunakan Git dari terminal pada folder project:

```bash
git init
git add .
git commit -m "Initial NEXUS portfolio"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Ganti URL remote dengan URL repository milikmu.

### B. Import repository ke Vercel

1. Login ke [Vercel](https://vercel.com/).
2. Pilih **Add New → Project**.
3. Hubungkan GitHub jika belum terhubung.
4. Pilih repository NEXUS, lalu klik **Import**.
5. Pastikan pengaturan berikut:

| Pengaturan | Nilai |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `./` jika `package.json` berada di root repository |
| Install Command | `npm install` atau default Vercel |
| Build Command | `npm run build` atau default Vercel |
| Output Directory | Biarkan default Next.js; jangan isi `out` |
| Node.js Version | 22.x |

6. Sebelum deploy, buka bagian **Environment Variables**.
7. Tambahkan dua variabel berikut:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable Key dari Supabase |

Aktifkan variabel untuk **Production**, **Preview**, dan **Development** sesuai kebutuhan. Nilai yang dipakai di Vercel harus berasal dari project Supabase milikmu.

8. Klik **Deploy**.

### C. Setelah deployment berhasil

1. Buka URL deployment yang diberikan Vercel.
2. Coba tombol **EXPLORE AS GUEST**.
3. Coba login admin dengan akun yang sudah didaftarkan di Supabase dan `admin_users`.
4. Coba tambah satu item draft dari Admin Dashboard, lalu publikasikan setelah diperiksa.
5. Periksa halaman Functions/Runtime Logs jika ada error server.

Di Supabase, buka **Authentication → URL Configuration** dan atur **Site URL** ke domain produksi Vercel milikmu, misalnya `https://nama-project.vercel.app`. Tambahkan domain aplikasi yang digunakan ke daftar Redirect URLs apabila nanti kamu menambahkan alur reset password atau callback autentikasi.

Jika kamu mengubah Environment Variables di Vercel, lakukan **redeploy** agar deployment baru menggunakan nilai terbaru. Deployment yang sudah ada tidak otomatis mendapatkan perubahan variabel.

## 5. Deploy menggunakan Vercel CLI (opsional)

Dari folder project:

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel
```

Untuk deployment production:

```bash
vercel --prod
```

Pastikan environment variables sudah ditambahkan di project Vercel sebelum menjalankan deployment production.

## 6. Environment variables dan keamanan

File `.env.example` hanya berisi placeholder. Jangan commit `.env.local` atau menaruh secret key di kode frontend.

Variabel yang digunakan project ini:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Jangan pernah menambahkan Supabase `service_role` key atau secret key ke variabel `NEXT_PUBLIC_`.** Aplikasi menggunakan publishable key di sisi browser dan mengandalkan RLS serta pemeriksaan admin di server/database untuk otorisasi.

## 7. Troubleshooting deployment

### Build gagal karena environment variable

Pastikan nama variabel ditulis persis sama, tanpa tanda kutip tambahan, dan tersedia di environment Vercel yang sedang di-deploy. Setelah menambah atau mengubah variabel, deploy ulang.

### Halaman masuk tampil tetapi login gagal

Pastikan:
- URL dan Publishable Key mengarah ke project Supabase yang benar.
- Migration SQL sudah dijalankan.
- User tersedia di Supabase Authentication.
- UUID user sudah didaftarkan di `public.admin_users`.
- Policy RLS dan Storage dari migration berhasil dibuat.

### Website publik kosong

Konten baru akan tampil jika `is_published = true`. Periksa apakah profil, skill, proyek, pengalaman, dan achievement sudah diisi serta dipublikasikan dari dashboard.

### Deployment berhasil, tetapi ada error runtime

Buka **Vercel → Project → Deployments → deployment terbaru → Functions/Runtime Logs**. Periksa pesan error dan pastikan environment variables serta migration Supabase sudah benar.

## 8. Scope versi ini

- NEXUS entry page, login Supabase, dan guest access.
- Public portfolio dengan About, Skills, Projects, Experience, Achievements, dan Contact.
- Admin Dashboard dengan CRUD dasar.
- Supabase Database, Auth, Storage, dan RLS.
- Responsive styling dan animasi portal berbasis CSS.

Ini merupakan starter project yang perlu diuji dengan project Supabase milikmu sebelum dipakai sebagai website produksi. Periksa RLS, akun admin, dan alur upload file sebelum memasukkan data asli.
