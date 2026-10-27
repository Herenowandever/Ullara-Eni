import { createClient } from '@supabase/supabase-js'

// Trim and strip quotes people often paste by accident.
const clean = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '') : '')
const url = clean(import.meta.env.VITE_SUPABASE_URL)
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

function checkConfig(): string | null {
  if (!url && !key) return 'Neither VITE_SUPABASE_URL nor VITE_SUPABASE_ANON_KEY is set.'
  if (!url) return 'VITE_SUPABASE_URL is not set.'
  if (!key) return 'VITE_SUPABASE_ANON_KEY is not set.'
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return `VITE_SUPABASE_URL should be a web address like https://abcdefgh.supabase.co, but it starts with "${url.slice(0, 12)}…". Check you didn't swap the two values.`
  }
  if (u.protocol !== 'https:' && u.hostname !== 'localhost') return 'VITE_SUPABASE_URL must start with https://'
  if (/(^|\.)supabase\.com$/.test(u.hostname)) {
    return 'VITE_SUPABASE_URL is the address of the Supabase dashboard page. Use the Project URL instead, from Supabase → Project Settings → Data API; it looks like https://abcdefghijkl.supabase.co.'
  }
  if (u.hostname === window.location.hostname || /\.vercel\.app$|\.netlify\.app$|vercel\.com$/.test(u.hostname)) {
    return `VITE_SUPABASE_URL is set to ${u.hostname}, which is a website address, not your Supabase project. Use the Project URL from Supabase → Project Settings → Data API; it ends in .supabase.co.`
  }
  if (key.startsWith('http')) return 'VITE_SUPABASE_ANON_KEY contains a web address. It should be the long key, not the URL. Check you didn\'t swap the two values.'
  if (key.startsWith('sb_secret_') || /service_role/.test(atobSafe(key.split('.')[1] ?? ''))) {
    return 'VITE_SUPABASE_ANON_KEY is your secret service key. Replace it with the anon public (or Publishable) key, and keep the secret key private.'
  }
  return null
}
function atobSafe(s: string) {
  try {
    return atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return ''
  }
}

export const configError = checkConfig()
export const isConfigured = configError === null

// Keep only https://<project>.supabase.co, dropping anything pasted after it such as /rest/v1/.
const directUrl = isConfigured ? new URL(url).origin : 'https://not-configured.supabase.co'

// On the live site, talk to Supabase through our own address (/sb, set up in vercel.json),
// so phones never contact supabase.co directly. This keeps the app working if an internet
// provider blocks Supabase, as some Indian providers did in early 2026.
// Live updates (websockets) can't go through this route, so the admin board falls back to
// refreshing every two minutes. Set VITE_SUPABASE_PROXY=off to connect directly instead.
const useProxy =
  isConfigured &&
  import.meta.env.VITE_SUPABASE_PROXY !== 'off' &&
  typeof window !== 'undefined' &&
  /\.vercel\.app$/.test(window.location.hostname)
const baseUrl = useProxy ? `${window.location.origin}/sb` : directUrl

export const supabase = createClient(baseUrl, isConfigured ? key : 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export type Role = 'admin' | 'supervisor' | 'employee'

export interface Profile {
  id: string
  company_id: string
  full_name: string
  job_title: string | null
  role: Role
  shift_id: string | null
  active: boolean
  consented_at: string | null
  has_login: boolean
  office_id: string | null
  daily_wage: number | null
  ot_hourly_rate: number | null
  pay_type: 'daily' | 'monthly'
  monthly_salary: number | null
  approved: boolean
}

export interface Company {
  id: string
  name: string
  timezone: string
  join_code: string
  weekly_offs: number[]
  paid_weekly_off: boolean
  paid_holidays: boolean
  half_day_hours: number | null
  ot_after_minutes: number
  ot_multiplier: number
  pay_cycle: 'monthly' | 'weekly'
  week_starts: number
  require_approval: boolean
  photo_retention_days: number
  require_admin_mfa: boolean
}

export const COMPANY_COLS =
  'id, name, timezone, join_code, weekly_offs, paid_weekly_off, paid_holidays, half_day_hours, ot_after_minutes, ot_multiplier, pay_cycle, week_starts, require_approval, photo_retention_days, require_admin_mfa'

export interface Shift {
  id: string
  company_id: string
  name: string
  start_time: string
  end_time: string
  grace_minutes: number
}

export interface Office {
  id: string
  company_id: string
  name: string
  lat: number
  lng: number
  radius_m: number
}

export interface Attendance {
  id: string
  user_id: string
  work_date: string
  office_id: string | null
  clock_in_at: string
  clock_out_at: string | null
  in_method: Method
  out_method: Method | null
  in_distance_m: number | null
  selfie_path: string | null
  shift_start: string | null
  shift_end: string | null
  is_late: boolean
  edited_by: string | null
  marked_by: string | null
  group_photo_path: string | null
  day_status: 'full' | 'half' | null
}

export type Method = 'gps' | 'qr' | 'crew' | 'manual'
export const METHOD_LABEL: Record<Method, string> = { gps: 'GPS', qr: 'QR', crew: 'CREW', manual: 'MANUAL' }

export const PROFILE_COLS =
  'id, company_id, full_name, job_title, role, shift_id, active, consented_at, has_login, office_id, daily_wage, ot_hourly_rate, pay_type, monthly_salary, approved'
export const ATTENDANCE_COLS =
  'id, user_id, work_date, office_id, clock_in_at, clock_out_at, in_method, out_method, in_distance_m, selfie_path, shift_start, shift_end, is_late, edited_by, marked_by, group_photo_path, day_status'
