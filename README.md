# Church QR Attendance

Admin-only QR attendance system for church use, built with Next.js + Supabase.

## Features

- Admin login with DB-backed session tokens.
- Member creation (not account registration):
	- last name, first name, middle name
	- address
	- date of birth
	- sex
	- age
	- contact number (optional)
	- avatar profile picture (Supabase Storage bucket)
- Auto-generated QR token per member.
- Printable card page with both logos:
	- `public/logo_1.jpg`
	- `public/logo_2.png`
- PDF export of member cards.
- Camera QR scanner for attendance.
- Attendance rule: one attendance per member per service date.
- Offline queue fallback with manual `Sync Now`.

## Tech Stack

- Next.js App Router
- Supabase (Postgres + Storage)
- `html5-qrcode` for scanning
- `react-qr-code` for QR generation
- `html2canvas` + `jspdf` for PDF export

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_AVATAR_BUCKET` (default: `member-avatars`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET` (default: `member-avatars`)

4. Run SQL in Supabase SQL editor:

- `supabase/schema.sql`
- `supabase/storage_and_policies.sql`

5. Start dev server:

```bash
npm run dev
```

6. Login as seeded admin:

- email: `admin@church.local`
- password: `admin123`

## Notes

- Change the seeded admin password hash before production use.
- API routes use service role server-side; client does not need service key.
- Offline scans are queued in browser localStorage and synced via `Sync Now`.
