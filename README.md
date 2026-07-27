# CogniFlip Frontend

CogniFlip adalah aplikasi web pendamping untuk **AI voice learning assistant**. Frontend ini dibangun dengan **Next.js App Router** dan menyediakan alur autentikasi, pemilihan persona, percakapan suara real-time, evaluasi sesi, serta laporan pembelajaran.

Repository ini merupakan pasangan dari [CogniFlip Backend](https://github.com/ItsBayyyy/cogni-be), layanan FastAPI yang menangani autentikasi, orkestrasi agen AI, transkripsi, sintesis suara, dan penyimpanan data.

## Fitur Utama

### Percakapan Suara Real-Time

- Merekam suara pengguna melalui browser `MediaRecorder`.
- Mengirim audio ke backend untuk transkripsi menggunakan Groq Whisper.
- Menampilkan respons AI secara bertahap melalui Server-Sent Events (SSE).
- Memutar balasan menggunakan audio Microsoft Edge TTS.
- Mengunci input mikrofon selama CogniFlip memproses giliran aktif untuk mencegah request paralel.

### Lima Persona Server-Owned

- **The Friend:** hangat dan suportif.
- **The Strict:** kritis dan menuntut penjelasan konkret.
- **The Socratic:** menggali pemahaman melalui pertanyaan.
- **The Comedian:** ringan dan humoris tanpa mengorbankan tujuan belajar.
- **The NAIN:** menolak penjelasan lemah secara dramatis lalu memberikan pertanyaan yang relevan.

Frontend hanya mengirim ID persona resmi. Definisi dan validasi persona berada di backend agar tidak dapat ditambah atau diganti melalui Inspect Element maupun request manual.

### Autentikasi dan Demo Juri

- Registrasi dan verifikasi OTP.
- Login serta reset password.
- Session JWT disimpan oleh Next.js BFF dalam cookie `HttpOnly` dan `SameSite=Strict`, serta `Secure` pada production.
- Tombol **Continue as demo judge** membuat akun sementara yang terisolasi tanpa membagikan kredensial statis.
- Halaman setup, session, reports, processing, dan result dilindungi oleh auth guard.

### Laporan Pembelajaran

- Riwayat sesi per pengguna.
- Transkrip percakapan.
- Evaluasi clarity, depth, pacing, dan charisma.
- Ringkasan kekuatan dan area yang perlu ditingkatkan.

## Arsitektur

```text
Browser
   │ same-origin /api/backend/*
   ▼
Next.js BFF (Vercel)
   │ Authorization: Bearer <server-side cookie value>
   ▼
FastAPI API (Railway)
   ├── PostgreSQL
   ├── Redis
   ├── Groq LLM / Whisper
   └── Microsoft Edge TTS
```

Browser tidak berkomunikasi langsung dengan Railway dan tidak pernah menerima JWT dalam JavaScript. Route handler Next.js meneruskan request ke backend, menyaring response header, menghapus token dari response login, dan menyimpannya dalam cookie `HttpOnly`.

## Security Controls

- Content Security Policy dengan nonce per request dan `strict-dynamic`.
- Proteksi clickjacking melalui `frame-ancestors 'none'` dan `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- Permissions Policy membatasi kamera, mikrofon, dan geolokasi.
- Pemeriksaan same-origin pada request yang mengubah state sebagai perlindungan CSRF.
- Backend URL menggunakan environment variable server-only, bukan `NEXT_PUBLIC_*`.
- Error backend tidak dirender mentah ke antarmuka pengguna.
- Persona dan kepemilikan session tetap divalidasi oleh backend.

Kontrol frontend bukan pengganti otorisasi server. Semua resource privat tetap harus memvalidasi token dan kepemilikan objek pada FastAPI.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **UI:** Radix UI, Lucide React
- **Charts:** Recharts
- **Analytics:** Vercel Analytics
- **Deployment:** Vercel

## Prasyarat

- Node.js 20 atau versi LTS yang lebih baru.
- pnpm melalui Corepack.
- CogniFlip Backend yang sudah berjalan.
- Browser modern dengan izin mikrofon.

## Instalasi Lokal

1. Clone repository:

   ```bash
   git clone https://github.com/ItsBayyyy/cogni-fe.git
   cd cogni-fe
   ```

2. Aktifkan pnpm dan install dependency:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   ```

3. Salin konfigurasi environment:

   ```bash
   cp .env.example .env
   ```

   Pada PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Isi `.env`:

   ```env
   COGNIFLIP_API_BASE_URL=http://localhost:8000/api/v1
   SITE_URL=http://localhost:3000
   ```

5. Jalankan development server:

   ```bash
   pnpm dev
   ```

Aplikasi tersedia di `http://localhost:3000`.

## Environment Variables

| Variable | Wajib | Scope | Keterangan |
|---|---:|---|---|
| `COGNIFLIP_API_BASE_URL` | Ya | Server-only | Base URL FastAPI beserta prefix `/api/v1`. |
| `SITE_URL` | Ya | Server-only | Base URL publik frontend untuk metadata. |

Jangan mengubah kedua variable tersebut menjadi `NEXT_PUBLIC_*`. API key, JWT secret, database URL, dan kredensial provider tidak boleh ditempatkan pada environment frontend.

Tombol demo juri dikendalikan oleh `DEMO_LOGIN_ENABLED=true` pada environment **backend Railway**, bukan Vercel.

## Quality Gates

Jalankan seluruh pemeriksaan sebelum membuka pull request atau melakukan deployment:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Build TypeScript dikonfigurasi fail-closed: error TypeScript akan menggagalkan production build.

## Deployment ke Vercel

1. Hubungkan repository `ItsBayyyy/cogni-fe` ke Vercel.
2. Gunakan framework preset **Next.js**.
3. Tambahkan environment variable production:

   ```env
   COGNIFLIP_API_BASE_URL=https://<backend-railway>/api/v1
   SITE_URL=https://<frontend-vercel>
   ```

4. Pastikan backend Railway mengizinkan origin frontend melalui `CORS_ORIGINS`.
5. Deploy frontend setelah backend dapat diakses melalui HTTPS.

Tidak ada API key atau credential pengguna yang diperlukan di Vercel.

## Struktur Direktori Utama

```text
├── app/
│   ├── api/backend/     # BFF proxy dan pengelolaan cookie HttpOnly
│   ├── login/           # Login, registrasi, OTP, reset, dan demo juri
│   ├── setup/           # Pemilihan topik dan persona
│   ├── session/         # Voice conversation dan SSE streaming
│   ├── processing/      # Status evaluasi
│   ├── result/          # Hasil evaluasi sesi
│   └── reports/         # Riwayat sesi pengguna
├── components/          # Komponen UI dan auth guard
├── hooks/               # React hooks
├── lib/
│   ├── api.ts           # Client API same-origin
│   └── auth.ts          # Alur autentikasi
├── public/              # Static assets
├── proxy.ts             # CSP nonce dan security headers
└── next.config.mjs      # Konfigurasi Next.js
```

## Integrasi dengan Backend

Untuk pengembangan penuh, jalankan backend pada `http://localhost:8000` dan frontend pada `http://localhost:3000`. Pastikan backend memiliki:

```env
CORS_ORIGINS=http://localhost:3000
JWT_AUDIENCE=cogniflip-web
JWT_ISSUER=cogniflip-api
```

Persona baru harus ditambahkan secara konsisten pada schema backend, prompt server, constraint PostgreSQL, tipe frontend, dan metadata UI. Jangan mengirim instruksi persona melalui topic atau query string.
