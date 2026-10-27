# Ullara-Eni

Attendance for construction sites, field crews and small businesses. Employees clock in from their phone with a **location check**, a **selfie**, and a **QR code backup**. **Site supervisors** mark whole crews in and out with one group photo, including workers who don't have a phone. Admins get a live attendance board, shift scheduling, site zones, monthly reports and a **daily-wage sheet** for payroll. Works in **English, Hindi and Kannada**. Many companies can use one deployment; each company only ever sees its own data.

Built with React + Vite (a web app that installs to the home screen) and Supabase (database, logins, photo storage).

---

## Setup (about 15 minutes)

### 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project. Pick a region close to your users (for India, **Mumbai**).
2. Open **SQL Editor → New query**, paste everything from `supabase/migrations/0001_herenow.sql`, and click **Run**.
3. Do the same with `supabase/migrations/0002_selfie_storage.sql`, then `0003_crews_and_wages.sql`, `0004_remove_member.sql`, `0005_pay_rules.sql`, `0006_safety.sql`, `0007_worker_pin_login.sql` and `0008_hardening.sql`. Always run the files in number order; when an update adds a new file, run just that one. Shortcut: after 0001 and 0002, you can run `supabase/ALL_UPDATES_0003_to_0006.sql` once instead of 0003–0006.
4. Go to **Authentication → URL Configuration** and set **Site URL** to the address where the app will live (for example `https://your-project.vercel.app`). You can update it after deploying.
5. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key.

### 2. Deploy the app on Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub and click **Add New → Project**. Import this repository.
2. Vercel detects Vite. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: your Project URL
   - `VITE_SUPABASE_ANON_KEY`: your anon public key
3. Click **Deploy**. When it finishes, put the site address into Supabase's **Site URL** (step 1.4).

Netlify, Cloudflare Pages and similar hosts work the same way: build command `npm run build`, output folder `dist`.

### 3. Daily background job (deletes old photos)

Each company chooses how long check-in photos are kept (Company → Security and privacy). A small job removes older ones every night.

1. In Supabase, open **Edge Functions → Deploy a new function → Via editor**. Name it `daily-jobs`, paste the contents of `supabase/functions/daily-jobs/index.ts`, and deploy.
2. Open the function's **Details** and turn **Verify JWT** off. The function checks its own secret instead.
3. Open **Edge Functions → Secrets** and add `CRON_SECRET` with a long random value (for example, 40 random letters and numbers). Keep it private.
4. Open **Integrations → Cron**, enable it if asked, and **Create job**: name `daily-jobs`, schedule `30 20 * * *` (2:00 am India time), type **Supabase Edge Function**, function `daily-jobs`, method POST, and add an HTTP header `x-cron-secret` with the same value as step 3.
5. Run the job once with **Run now** and check its result: it should report `photosDeleted` and no errors.

The same job will send WhatsApp alerts later.

### 4. First use

1. Open the site, click **Create account**, confirm your email, and sign in.
2. Choose **I'm setting up my company**. You become the company's admin.
3. Go to **Offices & QR**, stand inside your office, and tap **Use my current location**. Choose a zone size (100–200 m suits most buildings).
4. Go to **Team** and share the invite link or the 8-character company code with your employees.
5. Optional: open **Open QR screen** on a tablet at reception as a backup for places where GPS is weak.

Employees can install the app from their phone browser: on Android, use **Add to Home screen** in Chrome; on iPhone, use **Share → Add to Home Screen** in Safari.

---

## How it works

| Feature | Details |
|---|---|
| Location check | The phone's GPS position is sent with each clock-in and clock-out. The **database** checks the distance to the company's offices, so the rule can't be skipped by editing the app. Readings worse than ±100 m are refused. |
| Selfie | Taken with the front camera at clock-in and stored in a private bucket. Only the employee and their company's admins can open it. |
| QR backup | Each office has a secret. The reception screen shows a QR code and a 6-character code that change every day. |
| Shifts | Each shift has start and end times plus a grace period. Clocking in after the grace period marks the day as late. Night shifts that cross midnight are supported. |
| Attendance board | Live list of who is on site, late or not in. Admins can correct times, for example when someone forgets to clock out. |
| Monthly report | Days present, late days, QR check-ins, missing clock-outs, hours and overtime per person. Export as CSV for Excel or payroll software. |
| Site supervisors | A supervisor is assigned to one site. On the **Crew** page they tick the workers present, take a group photo, and mark them in or out together. The database checks the supervisor is at that site (GPS or the site QR). |
| Workers without a phone | Admins add them on the Team page. They never log in; their supervisor marks them. |
| Daily wages | Set a daily wage and, optionally, an overtime rate per person. The **Wage sheet** report counts full days, half days (less than half a shift) and overtime, and exports to CSV. Admins can mark any day as full or half on the Attendance page. |
| Company rules | Under **Company**: weekly off days, whether daily-wage staff are paid for offs and holidays, the half-day cut-off, when overtime starts and its rate (1×–2×), a holiday list, and a weekly or monthly pay cycle. |
| Salary staff | Each person is paid a daily wage or a monthly salary. Monthly salary is paid per day as salary ÷ days in the month, including offs and holidays; absent days are unpaid. |
| Advances & deductions | Record cash advances, deductions and bonuses on the wage sheet. They're applied to net pay in the period of their date. |
| Approving new members | On by default: people who join with the company code wait on the Team page until an admin approves them. |
| Photo retention | Selfies and crew photos are deleted after 30 days to 1 year (each company chooses; 90 days by default). |
| Two-step login | Admins can turn on a 6-digit code from an authenticator app (Company page), and a company can require it for all admins. The database enforces it: without the code, an admin's password alone gives no admin access. To reset a lost phone, delete the person's factor in Supabase → Authentication → Users → the user → MFA. |
| Activity log | The Activity page lists who changed people, wages, attendance times, advances and settings. |
| Worker PIN login | Admins tap **Set up app login** on a person's row in Team. The worker signs in on the **Worker** tab with the company code, a worker ID and a 6-digit PIN. No email is needed. Needs the `worker-login` Edge Function (in `supabase/functions/worker-login`, deployed with Verify JWT off). |
| Sign in with Google | Shown on the sign-in screen once the Google provider is switched on in Supabase (Authentication → Sign In / Providers → Google). |
| Languages | English, Hindi and Kannada for sign-in, clock-in, history and crew screens. Admin pages are in English. Have a native speaker check the wording before launch. |
| Privacy notice | Shown before an employee's first clock-in, and recorded when they accept it. |
| Multiple companies | Every table is protected by row-level security. Records are written only through database functions that check who is asking. |

### Project layout

```
supabase/migrations/   database tables, security rules and functions
src/pages/employee/    clock-in screen and personal history
src/pages/admin/       attendance board, team, shifts, offices, QR screen, reports, company settings
src/components/        selfie camera, QR scanner, layout
src/lib/               sign-in session, time zones, GPS, friendly error messages
```

### Running locally

```
cp .env.example .env.local   # then fill in the two values
npm install
npm run dev
```

The camera and GPS need HTTPS or `localhost`. To test on a phone, deploy a preview on Vercel.

---

## Good to know

- **GPS can be faked** on a rooted or developer-mode phone. The selfie and the server-side checks make cheating harder, but a determined person with a GPS-spoofing app can still pass the location check. For strict sites, use the QR screen, which requires being in front of it.
- **Email confirmation** is on by default in Supabase. You can switch it off under **Authentication → Providers → Email** while testing.
- Supabase's built-in email sender is rate limited. Before inviting a large team, add your own SMTP under **Authentication → Emails → SMTP Settings**.
- Selfies are kept until you delete them. Removing old selfies automatically (for example after 90 days) is a sensible next step.

## Ideas for later

Leave requests · push reminders to clock in · map picker for offices · payroll integrations · paid plans per company · native app wrappers.
