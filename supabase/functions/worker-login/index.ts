// Ullara-Eni: creates or resets a worker's sign-in (Company code + Worker ID + 6-digit PIN).
//
// Called from the Team page by an admin. The admin's own sign-in is checked by the database function
// admin_prepare_pin_login, which also decides the worker's ID and private sign-in address, so nothing
// the browser sends can pick someone else's account. Only then does this function use the secret key
// to create or update the worker's login.
//
// Deploy with "Verify JWT" off: this function checks the caller itself.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

function firstKey(envName: string): string | undefined {
  try {
    const keys = JSON.parse(Deno.env.get(envName) ?? '{}') as Record<string, string>
    return keys.default ?? Object.values(keys)[0]
  } catch {
    return undefined
  }
}

// Must match src/lib/pin.ts in the app.
export function pinPassword(loginCode: string, employeeNo: number, pin: string) {
  return `ullara-eni-pin:${loginCode.toUpperCase()}:${employeeNo}:${pin}`
}

export function weakPin(pin: string) {
  if (!/^\d{6}$/.test(pin)) return true
  if (/^(\d)\1{5}$/.test(pin)) return true
  const asc = '0123456789012345'
  const desc = '9876543210987654'
  return asc.includes(pin) || desc.includes(pin)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'BAD_REQUEST' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const publicKey = req.headers.get('apikey') ?? firstKey('SUPABASE_PUBLISHABLE_KEYS') ?? Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = firstKey('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const auth = req.headers.get('Authorization') ?? ''
  if (!publicKey || !secretKey) return json({ error: 'SERVER_NOT_CONFIGURED' }, 500)
  if (!auth.startsWith('Bearer ')) return json({ error: 'NOT_SIGNED_IN' }, 401)

  let body: { member_id?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'BAD_REQUEST' }, 400)
  }
  const memberId = String(body.member_id ?? '')
  const pin = String(body.pin ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) return json({ error: 'BAD_REQUEST' }, 400)
  if (weakPin(pin)) return json({ error: 'WEAK_PIN' }, 400)

  // 1. As the admin: check permission and get the worker's ID and sign-in address.
  const asCaller = createClient(url, publicKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: caller, error: callerErr } = await asCaller.auth.getUser(auth.slice(7))
  if (callerErr || !caller?.user) return json({ error: 'NOT_SIGNED_IN' }, 401)

  const { data: prep, error: prepErr } = await asCaller.rpc('admin_prepare_pin_login', { p_member: memberId })
  if (prepErr) return json({ error: prepErr.message }, 403)
  const row = (Array.isArray(prep) ? prep[0] : prep) as
    | { member_id: string; employee_no: number; login_code: string; login_email: string; full_name: string }
    | undefined
  if (!row) return json({ error: 'NOT_FOUND' }, 404)

  // 2. With the secret key: create the worker's login, or update it if it exists.
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const password = pinPassword(row.login_code, row.employee_no, pin)
  const existing = await admin.auth.admin.getUserById(row.member_id)

  if (existing.data?.user) {
    const { error } = await admin.auth.admin.updateUserById(row.member_id, {
      email: row.login_email,
      password,
      email_confirm: true,
      user_metadata: { pin_login: true, full_name: row.full_name },
    })
    if (error) return json({ error: `AUTH: ${error.message}` }, 500)
  } else {
    const { error } = await admin.auth.admin.createUser({
      id: row.member_id,
      email: row.login_email,
      password,
      email_confirm: true,
      user_metadata: { pin_login: true, full_name: row.full_name },
    })
    if (error) return json({ error: `AUTH: ${error.message}` }, 500)
  }

  const { error: markErr } = await admin.rpc('mark_pin_login', { p_member: row.member_id, p_actor: caller.user.id })
  if (markErr) return json({ error: markErr.message }, 500)

  return json({ employee_no: row.employee_no, login_code: row.login_code, full_name: row.full_name })
})
